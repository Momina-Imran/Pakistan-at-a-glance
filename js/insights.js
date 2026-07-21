// ── Config ──
// Local development mein:
const BACKEND_URL = 'http://127.0.0.1:8000';
// Production mein (Render deploy ke baad):
// const BACKEND_URL = 'https://tumhara-app.onrender.com';

let globalStats = null;

// ── Load CSVs and compute stats ── (ye same rahega)
async function loadAndComputeStats() {
  const [popData, econData, eduData, healthData, hdiData] = await Promise.all([
    d3.csv('data/population.csv'),
    d3.csv('data/economy.csv'),
    d3.csv('data/education.csv'),
    d3.csv('data/health.csv'),
    d3.csv('data/hdi_clean.csv')
  ]);

  const gdp = econData
    .filter(d => d.indicator_code === 'NY.GDP.MKTP.CD' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const inflation = econData
    .filter(d => d.indicator_code === 'FP.CPI.TOTL.ZG' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const exports_ = econData
    .filter(d => d.indicator_code === 'NE.EXP.GNFS.ZS' && !isNaN(+d.value));
  const imports_ = econData
    .filter(d => d.indicator_code === 'NE.IMP.GNFS.ZS' && !isNaN(+d.value));
  const litF = eduData
    .filter(d => d.indicator_code === 'SE.ADT.LITR.FE.ZS' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const litM = eduData
    .filter(d => d.indicator_code === 'SE.ADT.LITR.MA.ZS' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const primary = eduData
    .filter(d => d.indicator_code === 'SE.PRM.ENRR' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const lifeExp = healthData
    .filter(d => d.indicator_code === 'SP.DYN.LE00.IN' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const imr = healthData
    .filter(d => d.indicator_code === 'SP.DYN.IMRT.IN' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const beds = healthData
    .filter(d => d.indicator_code === 'SH.MED.BEDS.ZS' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const nutrition = healthData
    .filter(d => d.indicator_code === 'SN.ITK.DEFC.ZS' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const pop = popData
    .filter(d => d.indicator_code === 'SP.POP.TOTL' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const urban = popData
    .filter(d => d.indicator_code === 'SP.URB.TOTL.IN.ZS' && !isNaN(+d.value))
    .sort((a, b) => +a.year - +b.year);
  const hdi2023 = hdiData
    .filter(d => +d.year === 2023 && d.Region !== 'Total')
    .sort((a, b) => +b.hdi - +a.hdi);
  const nationalHDI = hdiData
    .filter(d => d.Region === 'Total')
    .sort((a, b) => +a.year - +b.year);

  const commonYears = inflation
    .filter(i => primary.find(p => +p.year === +i.year))
    .map(i => ({
      year: +i.year,
      inflation: +i.value,
      enrollment: +(primary.find(p => +p.year === +i.year)?.value || 0)
    }));
  const highInflationYears = commonYears
    .filter(d => d.inflation > 10)
    .map(d => `${d.year}(inf:${d.inflation.toFixed(1)}%,enroll:${d.enrollment.toFixed(1)}%)`);

  return {
    economy: {
      gdp_2001_billion: (+(gdp[0]?.value||0)/1e9).toFixed(1),
      gdp_latest_billion: (+(gdp[gdp.length-1]?.value||0)/1e9).toFixed(1),
      gdp_latest_year: gdp[gdp.length-1]?.year,
      inflation_max: Math.max(...inflation.map(d=>+d.value)).toFixed(1),
      inflation_max_year: inflation.reduce((a,b)=>+a.value>+b.value?a:b).year,
      inflation_2023: inflation.find(d=>+d.year===2023)?.value||'N/A',
      exports_avg_pct_gdp: (exports_.reduce((s,d)=>s+(+d.value),0)/exports_.length).toFixed(1),
      imports_avg_pct_gdp: (imports_.reduce((s,d)=>s+(+d.value),0)/imports_.length).toFixed(1),
    },
    education: {
      literacy_female_latest: litF[litF.length-1]?.value,
      literacy_female_latest_year: litF[litF.length-1]?.year,
      literacy_male_latest: litM[litM.length-1]?.value,
      gender_gap: (+litM[litM.length-1]?.value - +litF[litF.length-1]?.value).toFixed(1),
      primary_enrollment_latest: primary[primary.length-1]?.value,
      high_inflation_enrollment: highInflationYears.join(', ')
    },
    health: {
      life_exp_2001: lifeExp[0]?.value,
      life_exp_latest: lifeExp[lifeExp.length-1]?.value,
      imr_2001: imr[0]?.value,
      imr_latest: imr[imr.length-1]?.value,
      hospital_beds_avg: (beds.reduce((s,d)=>s+(+d.value),0)/beds.length).toFixed(2),
      undernourishment_latest: nutrition[nutrition.length-1]?.value,
    },
    population: {
      pop_2001_million: (+(pop[0]?.value||0)/1e6).toFixed(1),
      pop_latest_million: (+(pop[pop.length-1]?.value||0)/1e6).toFixed(1),
      urban_pct_latest: urban[urban.length-1]?.value,
    },
    hdi: {
      national_2023: nationalHDI[nationalHDI.length-1]?.hdi,
      national_1990: nationalHDI[0]?.hdi,
      highest_province: `${hdi2023[0]?.Region}(${(+hdi2023[0]?.hdi).toFixed(3)})`,
      lowest_province: `${hdi2023[hdi2023.length-1]?.Region}(${(+hdi2023[hdi2023.length-1]?.hdi).toFixed(3)})`,
      all_provinces: hdi2023.map(d=>`${d.Region}:${(+d.hdi).toFixed(3)}`).join(', ')
    }
  };
}

// ── Core API call — backend pe ──
async function callBackend(question, mode = 'chat', history = []) {
  if (!globalStats) globalStats = await loadAndComputeStats();

  // Transparency box update
  document.getElementById('transparency-box').innerHTML =
    `<pre class="transparency-pre">${JSON.stringify(globalStats, null, 2)}</pre>`;

  const response = await fetch(`${BACKEND_URL}/api/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      stats: globalStats,
      mode,
      history: history.slice(-3)   // sirf last 3 — stateless
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Backend error');
  }

  const data = await response.json();
  return data.answer;
}

// ── Render formatted text ──
function renderOutput(containerId, text) {
  const container = document.getElementById(containerId);
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
  container.innerHTML = `<div class="ai-response">${formatted}</div>`;
}

function setLoading(containerId) {
  document.getElementById(containerId).innerHTML =
    `<div class="loading-wrap">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <p class="loading-text">AI is analyzing Pakistan's data...</p>
    </div>`;
}

// ── Generate Summary ──
document.getElementById('generate-summary-btn').addEventListener('click', async () => {
  setLoading('summary-output');
  try {
    const result = await callBackend(
      `Analyze Pakistan's overall socioeconomic performance. Cover:
      1. Economic trajectory and inflation impact
      2. How trade deficit affects other indicators  
      3. Education and health progress
      4. Provincial HDI disparities
      5. Top 3 government policy priorities`,
      'summary'
    );
    renderOutput('summary-output', result);
  } catch (err) {
    document.getElementById('summary-output').innerHTML =
      `<p class="error-text">⚠️ ${err.message}</p>`;
  }
});

// ── Correlation Explorer ──
document.getElementById('explore-btn').addEventListener('click', async () => {
  const selected = document.getElementById('correlation-select').value;
  setLoading('correlation-output');

  const prompts = {
    inflation_education: `Analyze correlation between Pakistan's inflation and education enrollment. 
      Look at high inflation years and enrollment drops. Explain mechanism and policy fix.`,
    gdp_health: `Has Pakistan's GDP growth translated into better health outcomes? 
      Analyze life expectancy and infant mortality trends vs GDP growth.`,
    trade_inflation: `Analyze Pakistan's persistent trade deficit and its relationship with inflation. 
      Exports avg ${globalStats?.economy?.exports_avg_pct_gdp}% vs imports ${globalStats?.economy?.imports_avg_pct_gdp}% of GDP. What sectors should develop?`,
    population_hdi: `How has rapid population growth affected HDI progress in Pakistan? 
      Is service delivery keeping pace?`,
    literacy_hdi: `Analyze relationship between literacy rates and HDI across Pakistan's provinces. 
      Which provinces are outliers and why?`
  };

  try {
    const result = await callBackend(prompts[selected], 'correlation');
    renderOutput('correlation-output', result);
  } catch (err) {
    document.getElementById('correlation-output').innerHTML =
      `<p class="error-text">⚠️ ${err.message}</p>`;
  }
});

// ── Chat ──
const chatHistory = [];

function appendMessage(role, text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`;
  div.innerHTML = role === 'user'
    ? `<span class="chat-bubble-user">${text}</span>`
    : `<span class="chat-bubble-ai">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendChat(userMessage) {
  if (!userMessage.trim()) return;
  appendMessage('user', userMessage);
  chatHistory.push({ role: 'user', content: userMessage });

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chat-msg chat-msg-ai';
  loadingDiv.innerHTML = `<span class="chat-bubble-ai">
    <div class="loading-dots"><span></span><span></span><span></span></div>
  </span>`;
  document.getElementById('chat-messages').appendChild(loadingDiv);

  try {
    const result = await callBackend(userMessage, 'chat', chatHistory);
    loadingDiv.remove();
    appendMessage('ai', result);
    chatHistory.push({ role: 'assistant', content: result });
  } catch (err) {
    loadingDiv.remove();
    appendMessage('ai', `⚠️ Error: ${err.message}`);
  }
}

document.getElementById('chat-send-btn').addEventListener('click', () => {
  const input = document.getElementById('chat-input');
  sendChat(input.value);
  input.value = '';
});

document.getElementById('chat-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const input = document.getElementById('chat-input');
    sendChat(input.value);
    input.value = '';
  }
});

document.querySelectorAll('.sq-btn').forEach(btn => {
  btn.addEventListener('click', () => sendChat(btn.textContent));
});