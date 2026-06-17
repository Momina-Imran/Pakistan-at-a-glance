import pandas as pd

df = pd.read_csv('HDI.csv')

# Subnat AND National dono rakho
filtered = df[df['Level'].isin(['Subnat', 'National'])].copy()

year_cols = [col for col in df.columns if col.isdigit()]

melted = filtered.melt(
    id_vars=['Region', 'Level'],
    value_vars=year_cols,
    var_name='year',
    value_name='hdi'
)

melted['year'] = melted['year'].astype(int)
melted = melted[melted['year'].between(2000, 2023)]

# National row ka Region "Total" rakho
melted.loc[melted['Level'] == 'National', 'Region'] = 'Total'

melted['Region'] = melted['Region'].str.replace(
    'Khyber Pakhtunkhwa (NWFrontier)', 'KPK', regex=False
)

melted = melted[['Region', 'year', 'hdi']]
melted.to_csv('hdi_clean.csv', index=False)
print("Done!")
print(melted['Region'].unique())