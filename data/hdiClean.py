import pandas as pd

# Load HDI data
df = pd.read_csv('HDI.csv')

# Sirf Subnat rows rakho (province-level)
provinces = df[df['Level'] == 'Subnat'].copy()

# Year columns extract karo
year_cols = [col for col in df.columns if col.isdigit()]

# Wide to long format
melted = provinces.melt(
    id_vars=['Region'],
    value_vars=year_cols,
    var_name='year',
    value_name='hdi'
)

melted['year'] = melted['year'].astype(int)

# 2000 se 2023 tak rakho
melted = melted[melted['year'].between(2000, 2023)]

# Clean region names
melted['Region'] = melted['Region'].str.replace(
    'Khyber Pakhtunkhwa (NWFrontier)', 'KPK', regex=False
)

melted.to_csv('hdi_clean.csv', index=False)
print("✅ hdi_clean.csv done")
print(melted.head(10))