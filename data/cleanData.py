import pandas as pd

# ── Load raw file (no skiprows needed!) ──
df = pd.read_csv('pakRaw.csv')

print("Columns:", df.columns.tolist())
print("Shape:", df.shape)

# ── Rename for easy use ──
df = df.rename(columns={'Series Code': 'indicator_code'})

# ── Year columns extract karo ──
year_cols = [col for col in df.columns if '[YR' in col]

def extract(codes, filename):
    subset = df[df['indicator_code'].isin(codes)][['indicator_code'] + year_cols].copy()
    
    # Wide to long format
    melted = subset.melt(
        id_vars='indicator_code',
        var_name='year',
        value_name='value'
    )
    
    # Year clean karo → "2001 [YR2001]" → 2001
    melted['year'] = melted['year'].str.extract(r'(\d{4})').astype(int)
    
    # ".." ko NaN banao, phir drop karo
    melted['value'] = melted['value'].replace('..', float('nan'))
    melted['value'] = pd.to_numeric(melted['value'], errors='coerce')
    melted = melted.dropna(subset=['value'])
    
    # 2001-2024 tak rakho
    melted = melted[melted['year'].between(2001, 2024)]
    
    melted.to_csv(filename, index=False)
    print(f"✅ {filename} done — {len(melted)} rows")

# ── Economy ──
extract([
    'NY.GDP.MKTP.CD',
    'FP.CPI.TOTL.ZG',
    'NE.EXP.GNFS.ZS',
    'NE.IMP.GNFS.ZS'
], 'economy.csv')

# ── Population ──
extract([
    'SP.POP.TOTL',
    'SP.URB.TOTL.IN.ZS',
    'SP.RUR.TOTL.ZS'
], 'population.csv')

# ── Education ──
extract([
    'SE.ADT.LITR.FE.ZS',
    'SE.ADT.LITR.MA.ZS',
    'SE.PRM.ENRR',
    'SE.SEC.ENRR'
], 'education.csv')

# ── Health ──
extract([
    'SP.DYN.LE00.IN',
    'SP.DYN.IMRT.IN',
    'SH.MED.BEDS.ZS',
    'SN.ITK.DEFC.ZS'
], 'health.csv')

print("\n🎉 All done!")