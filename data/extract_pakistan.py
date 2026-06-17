import json

with open('countries.geojson', 'r') as f:
    data = json.load(f)

# Pakistan filter karo
pakistan = [f for f in data['features'] 
            if f['properties'].get('ISO_A3') == 'PAK' 
            or f['properties'].get('ADMIN') == 'Pakistan']

result = {
    "type": "FeatureCollection",
    "features": pakistan
}

with open('pakistan.geojson', 'w') as f:
    json.dump(result, f)

print("Done! Features found:", len(pakistan))