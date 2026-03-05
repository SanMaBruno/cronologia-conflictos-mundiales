#!/usr/bin/env python3
"""
Add per-year death breakdown to UCDP entries in the CSV.
Stores in a new 'yearly_deaths' column as compact format: 2015:1890;2016:697;...
"""
import csv
from collections import defaultdict

UCDP_CSV = 'scripts/data-sources/API_VC.BTL.DETH_DS2_es_csv_v2_32063/deaths-in-armed-conflicts-based-on-where-they-occurred.csv'
MAIN_CSV = 'site/data/PoppyDataCSV.csv'

# Map from our Spanish war names to UCDP entity names
WAR_TO_ENTITY = {
    "Guerra civil siria (continuación)": "Syria",
    "Guerra en Afganistán (continuación)": "Afghanistan",
    "Guerra ruso-ucraniana": "Ukraine",
    "Guerra civil de Yemen": "Yemen",
    "Conflicto israelí-palestino (2023-2024)": "Israel",
    "Conflicto iraquí (ISIS y secuelas)": "Iraq",
    "Guerra del Tigray y conflictos etíopes": "Ethiopia",
    "Guerra contra el narcotráfico en México (continuación)": "Mexico",
    "Conflicto en Nigeria (Boko Haram / bandidaje)": "Nigeria",
    "Conflicto en RD Congo (continuación)": "Democratic Republic of Congo",
    "Guerra civil somalí (continuación)": "Somalia",
    "Guerra civil sudanesa": "Sudan",
    "Violencia urbana en Brasil": "Brazil",
    "Insurgencia en Burkina Faso": "Burkina Faso",
    "Guerra de Malí (conflicto del Sahel)": "Mali",
    "Guerra civil de Myanmar": "Myanmar",
    "Insurgencia en Pakistán": "Pakistan",
    "Guerra civil de Sudán del Sur (continuación)": "South Sudan",
    "Conflicto de Nagorno-Karabaj": "Azerbaijan",
    "Guerra civil libia (segunda)": "Libya",
    "Conflicto en Camerún (anglófono / Boko Haram)": "Cameroon",
    "Conflicto en República Centroafricana": "Central African Republic",
    "Insurgencia en Níger (Sahel)": "Niger",
    "Insurgencia en Cabo Delgado (Mozambique)": "Mozambique",
    "India (Cachemira / insurgencia maoísta)": "India",
    "Conflicto en Líbano (2024)": "Lebanon",
    "Insurgencia en el Sinaí (Egipto)": "Egypt",
    "Conflicto en Filipinas (Mindanao)": "Philippines",
    "Turquía vs PKK (continuación)": "Turkey",
    "Conflicto colombiano (post-paz)": "Colombia",
    "Rusia (Cáucaso Norte / interno)": "Russia",
    "Violencia de pandillas en Haití": "Haiti",
    "Insurgencia en Chad": "Chad",
    "Violencia en Ecuador": "Ecuador",
    "Congo (Brazzaville) conflicto": "Congo",
    "Irán vs grupos kurdos/internos": "Iran",
    "Kenia (amenaza Al-Shabaab)": "Kenya",
    "Crisis en Burundi": "Burundi",
    "Conflicto en Bangladés": "Bangladesh",
    "Benín (expansión del Sahel)": "Benin",
    "Violencia tribal en Papúa Nueva Guinea": "Papua New Guinea",
    "Conflicto armado en Togo": "Togo",
    "Indonesia (insurgencia en Papúa)": "Indonesia",
    "Conflicto fronterizo Arabia Saudita-Yemen": "Saudi Arabia",
    "Violencia en Honduras": "Honduras",
    "Violencia en Venezuela": "Venezuela",
    "Argelia (insurgencia islamista cont.)": "Algeria",
    "Insurgencia en el sur de Tailandia": "Thailand",
}


def load_ucdp_yearly():
    yearly = defaultdict(dict)
    with open(UCDP_CSV) as f:
        for r in csv.DictReader(f):
            entity = r['Entity']
            year = int(r['Year'])
            deaths = int(float(r['Deaths in ongoing conflicts (best estimate) - Conflict type: all']))
            if deaths > 0:
                yearly[entity][year] = deaths
    return yearly


def main():
    ucdp_yearly = load_ucdp_yearly()
    
    with open(MAIN_CSV) as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)
    
    # Add yearly_deaths field if not present
    if 'yearly_deaths' not in fieldnames:
        fieldnames.append('yearly_deaths')
    
    matched = 0
    for row in rows:
        row.setdefault('yearly_deaths', '')
        
        if 'UCDP' not in row.get('notes', ''):
            continue
        
        war_name = row['wars']
        entity = WAR_TO_ENTITY.get(war_name)
        
        if not entity:
            print(f"  WARNING: No entity mapping for: {war_name}")
            continue
        
        if entity not in ucdp_yearly:
            print(f"  WARNING: No UCDP data for entity: {entity}")
            continue
        
        from_year = int(row['from'])
        to_year = int(row['to'])
        
        yearly_data = ucdp_yearly[entity]
        parts = []
        for year in range(from_year, to_year + 1):
            if year in yearly_data:
                parts.append(f"{year}:{yearly_data[year]}")
        
        if parts:
            row['yearly_deaths'] = ';'.join(parts)
            matched += 1
            # Show first few
            if matched <= 5:
                print(f"  {war_name}: {row['yearly_deaths'][:100]}")
    
    print(f"\nMatched {matched} UCDP entries with per-year data")
    
    with open(MAIN_CSV, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"Written to {MAIN_CSV}")
    
    # Verify
    with open(MAIN_CSV) as f:
        reader = csv.DictReader(f)
        rows2 = list(reader)
    
    count_with_yearly = sum(1 for r in rows2 if r.get('yearly_deaths'))
    print(f"Entries with yearly_deaths: {count_with_yearly}")
    
    # Show Ukraine as example
    for r in rows2:
        if 'ucraniana' in r['wars'].lower():
            print(f"\nUkraine yearly data: {r['yearly_deaths']}")


if __name__ == '__main__':
    main()
