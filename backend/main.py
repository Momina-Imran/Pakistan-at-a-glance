# backend/main.py

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import time
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# ── CORS — sirf tumhara domain allow karo ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",                           # local dev
        "https://momina-imran.github.io"                   # production
    ],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

# ── API Key — environment variable se (never hardcode) ──
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

# ── Rate Limiting — simple in-memory ──
request_counts = defaultdict(list)
RATE_LIMIT = 10        # requests per window
RATE_WINDOW = 60       # seconds

def is_rate_limited(ip: str) -> bool:
    now = time.time()
    # Old requests hatao
    request_counts[ip] = [t for t in request_counts[ip] 
                          if now - t < RATE_WINDOW]
    if len(request_counts[ip]) >= RATE_LIMIT:
        return True
    request_counts[ip].append(now)
    return False

# ── Request Models ──
class InsightRequest(BaseModel):
    question: str
    stats: dict
    mode: str = "chat"
    history: Optional[list] = []   # max 3 turns from frontend

# ── System Prompt Builder ──
def build_system_prompt(stats: dict) -> str:
    return f"""You are an expert policy analyst for Pakistan.
Answer questions using ONLY the provided data. 
Cite specific numbers. Be concise (3-5 sentences).
Do not make up data not present in the stats.
If asked something unrelated to Pakistan's socioeconomic data, politely decline.

Pakistan Socioeconomic Data (World Bank + Global Data Lab):
{stats}"""

# ── Main Endpoint ──
@app.post("/api/insights")
async def get_insights(request: Request, body: InsightRequest):

    # Rate limit check
    client_ip = request.client.host
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait."
        )

    # Validate
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question required")
    if len(body.question) > 500:
        raise HTTPException(status_code=400, detail="Question too long")

    # Build messages — stateless
    # Sirf last 3 history turns use karo
    safe_history = body.history[-3:] if body.history else []

    messages = [
        {"role": "system", "content": build_system_prompt(body.stats)},
        *safe_history,
        {"role": "user", "content": body.question}
    ]

    # Call Perplexity
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-sonar-small-128k-online",
                "messages": messages,
                "max_tokens": 600,
                "temperature": 0.3
            },
            timeout=30.0
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="AI service unavailable"
        )

    result = response.json()
    answer = result["choices"][0]["message"]["content"]

    # Return — store nothing ✅ stateless
    return {"answer": answer}

# ── Health check ──
@app.get("/health")
async def health():
    return {"status": "ok"}