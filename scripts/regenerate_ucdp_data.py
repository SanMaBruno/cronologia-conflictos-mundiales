#!/usr/bin/env python3
"""
Regenerate PoppyDataCSV.csv with correct UCDP data (2015-2024).
Keeps all 262 original entries intact, replaces 48 UCDP entries with
properly verified data using real date ranges and correct fatality totals.
"""
import csv
from collections import defaultdict

UCDP_FILE = 'scripts/data-sources/API_VC.BTL.DETH_DS2_es_csv_v2_32063/deaths-in-armed-conflicts-based-on-where-they-occurred.csv'
ORIGINAL_CSV = 'data/PoppyDataCSV.csv'
OUTPUT_CSV = 'data/PoppyDataCSV.csv'

# Load UCDP source data
def load_ucdp():
    with open(UCDP_FILE) as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    death_col = [c for c in rows[0].keys() if 'Deaths' in c][0]
    
    # Build: entity -> {year: deaths}
    data = defaultdict(dict)
    for r in rows:
        entity = r['Entity']
        year = int(r['Year'])
        deaths = int(r[death_col])
        data[entity][year] = deaths
    return data

def get_total(ucdp, entity, year_start, year_end):
    """Sum deaths for entity between year_start and year_end inclusive."""
    total = 0
    for y in range(year_start, year_end + 1):
        total += ucdp.get(entity, {}).get(y, 0)
    return total

def get_active_range(ucdp, entity, year_start=2015, year_end=2024):
    """Get first and last year with >0 deaths."""
    first, last = None, None
    for y in range(year_start, year_end + 1):
        d = ucdp.get(entity, {}).get(y, 0)
        if d > 0:
            if first is None:
                first = y
            last = y
    return first, last

def format_number(n):
    """Format number with commas: 123456 -> '123,456'"""
    return f'{n:,}'

# Define conflicts to add, mapping to UCDP entities
# Each: (name, ucdp_entities_list, from_override, to_override, participation, who, where, url_source, notes_extra)
CONFLICTS = [
    # Major conflicts
    ("Guerra civil siria (continuación)",
     ["Syria"], 2015, 2024,
     "Siria, Rusia, EE.UU., Turquía, Israel, ISIS, grupos rebeldes",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Guerra en Afganistán (continuación)",
     ["Afghanistan"], 2015, 2021,
     "Afganistán, EE.UU., OTAN, Talibán",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     "Incluye la retirada de EE.UU. (2021) y la toma talibán"),
    
    ("Guerra ruso-ucraniana",
     ["Ukraine"], 2015, 2024,
     "Ucrania, Rusia",
     "Europe, Asia", "Europe",
     "https://ourworldindata.org/war-and-peace",
     "Incluye la fase de baja intensidad (2015-2021) y la invasión a gran escala (2022-presente)"),
    
    ("Guerra civil de Yemen",
     ["Yemen"], 2015, 2024,
     "Yemen, Arabia Saudita, Emiratos Árabes Unidos, Hutíes",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto israelí-palestino (2023-2024)",
     ["Palestine", "Israel"], 2018, 2024,
     "Israel, Palestina, Hamás",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     "Incluye la guerra de Gaza (2023-2024)"),
    
    ("Conflicto iraquí (ISIS y secuelas)",
     ["Iraq"], 2015, 2024,
     "Irak, EE.UU., Kurdistán, ISIS",
     "Asia, North America", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Guerra del Tigray y conflictos etíopes",
     ["Ethiopia"], 2015, 2024,
     "Etiopía, Tigray, Eritrea",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     "La fase más letal fue la Guerra del Tigray (2020-2022)"),
    
    ("Guerra contra el narcotráfico en México (continuación)",
     ["Mexico"], 2015, 2024,
     "México, cárteles de droga",
     "North America", "North America",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto en Nigeria (Boko Haram / bandidaje)",
     ["Nigeria"], 2015, 2024,
     "Nigeria, Boko Haram, ISWAP, bandidos",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto en RD Congo (continuación)",
     ["Democratic Republic of Congo"], 2015, 2024,
     "República Democrática del Congo, M23, ADF, milicias",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Guerra civil somalí (continuación)",
     ["Somalia"], 2015, 2024,
     "Somalia, Al-Shabaab",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Guerra civil sudanesa",
     ["Sudan"], 2015, 2024,
     "Sudán, RSF, ejército sudanés",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     "La fase más intensa comenzó en abril de 2023"),
    
    ("Violencia urbana en Brasil",
     ["Brazil"], 2015, 2024,
     "Brasil, milicias, facciones criminales",
     "South America", "South America",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Insurgencia en Burkina Faso",
     ["Burkina Faso"], 2016, 2024,
     "Burkina Faso, JNIM, ISGS",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Guerra de Malí (conflicto del Sahel)",
     ["Mali"], 2015, 2024,
     "Malí, Francia, ONU, JNIM, ISGS",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Guerra civil de Myanmar",
     ["Myanmar"], 2015, 2024,
     "Myanmar, resistencia, grupos étnicos armados",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     "Escalada tras el golpe militar de 2021"),
    
    ("Insurgencia en Pakistán",
     ["Pakistan"], 2015, 2024,
     "Pakistán, TTP, ISIS-K",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Guerra civil de Sudán del Sur (continuación)",
     ["South Sudan"], 2015, 2024,
     "Sudán del Sur, facciones armadas",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto de Nagorno-Karabaj",
     ["Azerbaijan"], 2020, 2023,
     "Azerbaiyán, Armenia",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     "Incluye la guerra de 2020 y la ofensiva de 2023"),
    
    ("Guerra civil libia (segunda)",
     ["Libya"], 2015, 2024,
     "Libia, facciones rivales, ISIS",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto en Camerún (anglófono / Boko Haram)",
     ["Cameroon"], 2015, 2024,
     "Camerún, separatistas anglófonos, Boko Haram",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto en República Centroafricana",
     ["Central African Republic"], 2015, 2024,
     "República Centroafricana, Séléka, Anti-balaka",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Insurgencia en Níger (Sahel)",
     ["Niger"], 2015, 2024,
     "Níger, JNIM, ISGS, Boko Haram",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Insurgencia en Cabo Delgado (Mozambique)",
     ["Mozambique"], 2016, 2024,
     "Mozambique, ISIS-Mozambique, SADC",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("India (Cachemira / insurgencia maoísta)",
     ["India"], 2015, 2024,
     "India, insurgentes de Cachemira, maoístas",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto en Líbano (2024)",
     ["Lebanon"], 2015, 2024,
     "Líbano, Hezbolá, Israel",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     "Escalada significativa en 2024"),
    
    ("Insurgencia en el Sinaí (Egipto)",
     ["Egypt"], 2015, 2022,
     "Egipto, ISIS-Sinaí",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto en Filipinas (Mindanao)",
     ["Philippines"], 2015, 2024,
     "Filipinas, Abu Sayyaf, maoístas",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Turquía vs PKK (continuación)",
     ["Turkey"], 2015, 2024,
     "Turquía, PKK",
     "Europe", "Europe",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto colombiano (post-paz)",
     ["Colombia"], 2015, 2024,
     "Colombia, ELN, disidencias FARC, narcos",
     "South America", "South America",
     "https://ourworldindata.org/war-and-peace",
     "Post acuerdo de paz de 2016"),
    
    ("Rusia (Cáucaso Norte / interno)",
     ["Russia"], 2015, 2024,
     "Rusia, insurgentes del Cáucaso",
     "Europe", "Europe",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Violencia de pandillas en Haití",
     ["Haiti"], 2018, 2024,
     "Haití, pandillas armadas",
     "North America", "North America",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Insurgencia en Chad",
     ["Chad"], 2015, 2024,
     "Chad, Boko Haram, FACT",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Violencia en Ecuador",
     ["Ecuador"], 2019, 2024,
     "Ecuador, narcos, pandillas",
     "South America", "South America",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Congo (Brazzaville) conflicto",
     ["Congo"], 2016, 2024,
     "Congo (Brazzaville), Pool rebels",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Irán vs grupos kurdos/internos",
     ["Iran"], 2016, 2024,
     "Irán, PJAK, grupos internos",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Kenia (amenaza Al-Shabaab)",
     ["Kenya"], 2015, 2024,
     "Kenia, Al-Shabaab",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Crisis en Burundi",
     ["Burundi"], 2015, 2024,
     "Burundi, facciones armadas",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto en Bangladés",
     ["Bangladesh"], 2016, 2024,
     "Bangladesh, insurgentes",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Benín (expansión del Sahel)",
     ["Benin"], 2019, 2024,
     "Benín, yihadistas del Sahel",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Violencia tribal en Papúa Nueva Guinea",
     ["Papua New Guinea"], 2019, 2024,
     "Papúa Nueva Guinea, tribus",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto armado en Togo",
     ["Togo"], 2022, 2024,
     "Togo, yihadistas",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Indonesia (insurgencia en Papúa)",
     ["Indonesia"], 2018, 2024,
     "Indonesia, insurgentes de Papúa",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Conflicto fronterizo Arabia Saudita-Yemen",
     ["Saudi Arabia"], 2015, 2023,
     "Arabia Saudita, hutíes",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Violencia en Honduras",
     ["Honduras"], 2015, 2023,
     "Honduras, maras, narcos",
     "North America", "North America",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Violencia en Venezuela",
     ["Venezuela"], 2015, 2023,
     "Venezuela, grupos armados",
     "South America", "South America",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Argelia (insurgencia islamista cont.)",
     ["Algeria"], 2015, 2020,
     "Argelia, AQMI",
     "Africa", "Africa",
     "https://ourworldindata.org/war-and-peace",
     ""),
    
    ("Insurgencia en el sur de Tailandia",
     ["Thailand"], 2015, 2024,
     "Tailandia, separatistas malayos",
     "Asia", "Asia",
     "https://ourworldindata.org/war-and-peace",
     ""),
]

def main():
    ucdp = load_ucdp()
    
    # Load original CSV (non-UCDP entries only)
    with open(ORIGINAL_CSV) as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        all_rows = list(reader)
    
    original_rows = [r for r in all_rows if 'UCDP' not in r.get('notes', '')]
    print(f"Original entries kept: {len(original_rows)}")
    
    # Generate new entries from UCDP
    new_rows = []
    for (name, entities, from_yr, to_yr, participation, who, where, url, notes_extra) in CONFLICTS:
        # Get actual active range from UCDP data
        all_first, all_last = None, None
        total_deaths = 0
        for entity in entities:
            first, last = get_active_range(ucdp, entity, from_yr, to_yr)
            if first is not None:
                if all_first is None or first < all_first:
                    all_first = first
                if all_last is None or last > all_last:
                    all_last = last
            total_deaths += get_total(ucdp, entity, from_yr, to_yr)
        
        if total_deaths == 0:
            print(f"  SKIP (0 deaths): {name}")
            continue
        
        # Use actual active range
        actual_from = all_first if all_first else from_yr
        actual_to = all_last if all_last else to_yr
        duration = actual_to - actual_from
        
        notes = f"Fuente: UCDP/Our World in Data. {notes_extra}".strip()
        
        row = {
            'wars': name,
            'from': str(actual_from),
            'to': str(actual_to),
            'duration': str(duration),
            'notes': notes,
            'participation': participation,
            ' number_participants': str(len(participation.split(','))),
            'who': who,
            'where': where,
            'fatalities': format_number(total_deaths),
            'url_source': url,
            'memorials': '',
            'links': url,
        }
        new_rows.append(row)
        print(f"  {name:55s} {actual_from}-{actual_to} dur={duration:>2}  fat={format_number(total_deaths):>10s}  where={where}")
    
    print(f"\nNew UCDP entries: {len(new_rows)}")
    
    # Combine and write
    combined = original_rows + new_rows
    print(f"Total entries: {len(combined)}")
    
    with open(OUTPUT_CSV, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(combined)
    
    print(f"\nWritten to {OUTPUT_CSV}")
    
    # Verification
    print("\n=== VERIFICATION ===")
    # Check Ukraine
    for r in new_rows:
        if 'ucraniana' in r['wars'].lower():
            print(f"Ukraine: {r['wars']} = {r['fatalities']} deaths ({r['from']}-{r['to']})")
            # Show verification against UCDP
            ukr_total = get_total(ucdp, 'Ukraine', int(r['from']), int(r['to']))
            print(f"  UCDP Ukraine total {r['from']}-{r['to']}: {format_number(ukr_total)}")
            print(f"  UCDP Ukraine 2024 only: {format_number(ucdp['Ukraine'].get(2024, 0))}")
    
    for r in new_rows:
        if 'etíop' in r['wars'].lower():
            print(f"Ethiopia: {r['wars']} = {r['fatalities']} deaths ({r['from']}-{r['to']})")
            eth_total = get_total(ucdp, 'Ethiopia', int(r['from']), int(r['to']))
            print(f"  UCDP Ethiopia total {r['from']}-{r['to']}: {format_number(eth_total)}")
    
    for r in new_rows:
        if 'siria' in r['wars'].lower():
            print(f"Syria: {r['wars']} = {r['fatalities']} deaths ({r['from']}-{r['to']})")
            syr_total = get_total(ucdp, 'Syria', int(r['from']), int(r['to']))
            print(f"  UCDP Syria total {r['from']}-{r['to']}: {format_number(syr_total)}")

if __name__ == '__main__':
    main()
