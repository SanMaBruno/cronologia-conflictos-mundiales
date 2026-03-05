#!/usr/bin/env python3
"""
Process UCDP/Our World in Data battle deaths data to generate
conflict-based entries for PoppyDataCSV.csv (2015-2024).

Each entry = one conflict with proper from/to dates (like original data).
This preserves visual layout: x=endYear, y=duration, size=fatalities.
"""

import csv
import os

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, "site", "data", "API_VC.BTL.DETH_DS2_es_csv_v2_32063")
UCDP_CSV = os.path.join(DATA_DIR, "deaths-in-armed-conflicts-based-on-where-they-occurred.csv")
POPPY_ORIGINAL = os.path.join(BASE, "site", "data", "PoppyDataCSV_original.csv")
OUTPUT_CSV = os.path.join(BASE, "site", "data", "PoppyDataCSV.csv")

# Aggregates to exclude
EXCLUDE_ENTITIES = {
    "World", "Africa", "Americas", "Asia and Oceania", "Europe", "Middle East",
}

# ── Parse UCDP CSV ──────────────────────────────────────────────────
country_year_data = {}

with open(UCDP_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        entity = row["Entity"].strip()
        code = row["Code"].strip()
        year = int(row["Year"])
        deaths_col = "Deaths in ongoing conflicts (best estimate) - Conflict type: all"
        deaths = int(row[deaths_col].strip() or "0")

        if entity in EXCLUDE_ENTITIES or code.startswith("OWID_"):
            continue
        if deaths <= 0:
            continue

        if entity not in country_year_data:
            country_year_data[entity] = {}
        country_year_data[entity][year] = deaths

# ── Define conflicts for 2015-2024 ──────────────────────────────────
# Each conflict groups entities and UCDP year range properly.
# "from_year" = actual conflict start (for notes),
# "data_from"/"data_to" = which UCDP years to sum deaths from.
# "who"/"where" must match original conventions exactly.

CONFLICTS = [
    {
        "name": "Syrian Civil War (continued)",
        "entities": ["Syria"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Syria",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2011,
        "url": "https://en.wikipedia.org/wiki/Syrian_civil_war",
    },
    {
        "name": "War in Afghanistan (continued)",
        "entities": ["Afghanistan"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Afghanistan, United States",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2001,
        "url": "https://en.wikipedia.org/wiki/War_in_Afghanistan_(2001-2021)",
    },
    {
        "name": "Russo-Ukrainian War",
        "entities": ["Ukraine"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Ukraine, Russia",
        "who": "Europe, Asia", "where": "Europe",
        "conflict_start": 2014,
        "url": "https://en.wikipedia.org/wiki/Russo-Ukrainian_War",
    },
    {
        "name": "Yemeni Civil War",
        "entities": ["Yemen"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Yemen, Saudi Arabia",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2014,
        "url": "https://en.wikipedia.org/wiki/Yemeni_Civil_War_(2014-present)",
    },
    {
        "name": "Israeli-Palestinian Conflict (2023-2024)",
        "entities": ["Israel", "Palestine"],
        "from_year": 2018, "to_year": 2024,
        "participation": "Israel, Palestine",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2023,
        "url": "https://en.wikipedia.org/wiki/Israel-Hamas_war",
    },
    {
        "name": "Iraqi Conflict (ISIS and aftermath)",
        "entities": ["Iraq"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Iraq, United States",
        "who": "Asia, North America", "where": "Asia",
        "conflict_start": 2014,
        "url": "https://en.wikipedia.org/wiki/War_in_Iraq_(2013-2017)",
    },
    {
        "name": "Tigray War and Ethiopian Conflicts",
        "entities": ["Ethiopia"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Ethiopia, Eritrea",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2018,
        "url": "https://en.wikipedia.org/wiki/Tigray_War",
    },
    {
        "name": "Mexican Drug War (continued)",
        "entities": ["Mexico"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Mexico",
        "who": "North America", "where": "North America",
        "conflict_start": 2006,
        "url": "https://en.wikipedia.org/wiki/Mexican_drug_war",
    },
    {
        "name": "Nigerian Conflict (Boko Haram / Banditry)",
        "entities": ["Nigeria"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Nigeria",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2009,
        "url": "https://en.wikipedia.org/wiki/Boko_Haram_insurgency",
    },
    {
        "name": "Conflict in DR Congo (continued)",
        "entities": ["Democratic Republic of Congo"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Democratic Republic of the Congo, Rwanda",
        "who": "Africa", "where": "Africa",
        "conflict_start": 1996,
        "url": "https://en.wikipedia.org/wiki/Kivu_conflict",
    },
    {
        "name": "Somali Civil War (continued)",
        "entities": ["Somalia", "Somaliland"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Somalia",
        "who": "Africa", "where": "Africa",
        "conflict_start": 1991,
        "url": "https://en.wikipedia.org/wiki/Somali_Civil_War",
    },
    {
        "name": "Sudanese Civil War",
        "entities": ["Sudan", "Abyei"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Sudan",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2023,
        "url": "https://en.wikipedia.org/wiki/Sudanese_civil_war_(2023-present)",
    },
    {
        "name": "Brazilian Urban Violence",
        "entities": ["Brazil"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Brazil",
        "who": "South America", "where": "South America",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Crime_in_Brazil",
    },
    {
        "name": "Insurgency in Burkina Faso",
        "entities": ["Burkina Faso"],
        "from_year": 2016, "to_year": 2024,
        "participation": "Burkina Faso",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2016,
        "url": "https://en.wikipedia.org/wiki/Jihadist_insurgency_in_Burkina_Faso",
    },
    {
        "name": "Mali War (Sahel Conflict)",
        "entities": ["Mali"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Mali, France",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2012,
        "url": "https://en.wikipedia.org/wiki/Mali_War",
    },
    {
        "name": "Myanmar Civil War",
        "entities": ["Myanmar"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Myanmar",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2021,
        "url": "https://en.wikipedia.org/wiki/Myanmar_civil_war_(2021-present)",
    },
    {
        "name": "Insurgency in Pakistan",
        "entities": ["Pakistan"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Pakistan",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2004,
        "url": "https://en.wikipedia.org/wiki/Insurgency_in_Khyber_Pakhtunkhwa",
    },
    {
        "name": "South Sudan Civil War (continued)",
        "entities": ["South Sudan"],
        "from_year": 2015, "to_year": 2024,
        "participation": "South Sudan",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2013,
        "url": "https://en.wikipedia.org/wiki/South_Sudanese_Civil_War",
    },
    {
        "name": "Nagorno-Karabakh Conflict",
        "entities": ["Azerbaijan", "Armenia", "Nagorno-Karabakh"],
        "from_year": 2020, "to_year": 2023,
        "participation": "Azerbaijan, Armenia",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2020,
        "url": "https://en.wikipedia.org/wiki/2020_Nagorno-Karabakh_war",
    },
    {
        "name": "Libyan Civil War (Second)",
        "entities": ["Libya"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Libya",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2014,
        "url": "https://en.wikipedia.org/wiki/Second_Libyan_Civil_War",
    },
    {
        "name": "Cameroon Conflict (Anglophone / Boko Haram)",
        "entities": ["Cameroon"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Cameroon",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2017,
        "url": "https://en.wikipedia.org/wiki/Anglophone_Crisis",
    },
    {
        "name": "Central African Republic Conflict",
        "entities": ["Central African Republic"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Central African Republic",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2012,
        "url": "https://en.wikipedia.org/wiki/Central_African_Republic_Civil_War",
    },
    {
        "name": "Insurgency in Niger (Sahel)",
        "entities": ["Niger"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Niger",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Islamist_insurgency_in_the_Sahel",
    },
    {
        "name": "Cabo Delgado Insurgency (Mozambique)",
        "entities": ["Mozambique"],
        "from_year": 2017, "to_year": 2024,
        "participation": "Mozambique",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2017,
        "url": "https://en.wikipedia.org/wiki/Insurgency_in_Cabo_Delgado",
    },
    {
        "name": "India (Kashmir / Maoist Insurgency)",
        "entities": ["India"],
        "from_year": 2015, "to_year": 2024,
        "participation": "India, Pakistan",
        "who": "Asia", "where": "Asia",
        "conflict_start": 1990,
        "url": "https://en.wikipedia.org/wiki/Naxalite-Maoist_insurgency",
    },
    {
        "name": "Lebanon Conflict (2024)",
        "entities": ["Lebanon"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Lebanon, Israel",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2024,
        "url": "https://en.wikipedia.org/wiki/2023-2024_Israel-Hezbollah_conflict",
    },
    {
        "name": "Sinai Insurgency (Egypt)",
        "entities": ["Egypt"],
        "from_year": 2015, "to_year": 2022,
        "participation": "Egypt",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2011,
        "url": "https://en.wikipedia.org/wiki/Sinai_insurgency",
    },
    {
        "name": "Philippines Conflict (Mindanao)",
        "entities": ["Philippines"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Philippines",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2017,
        "url": "https://en.wikipedia.org/wiki/Moro_conflict",
    },
    {
        "name": "Turkey vs PKK (continued)",
        "entities": ["Turkey"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Turkey",
        "who": "Europe", "where": "Europe",
        "conflict_start": 1984,
        "url": "https://en.wikipedia.org/wiki/Kurdish-Turkish_conflict",
    },
    {
        "name": "Colombian Conflict (post-peace)",
        "entities": ["Colombia"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Colombia",
        "who": "South America", "where": "South America",
        "conflict_start": 1964,
        "url": "https://en.wikipedia.org/wiki/Colombian_conflict",
    },
    {
        "name": "Russia (North Caucasus / Internal)",
        "entities": ["Russia"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Russia",
        "who": "Europe", "where": "Europe",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Insurgency_in_the_North_Caucasus",
    },
    {
        "name": "Haiti Gang Violence",
        "entities": ["Haiti"],
        "from_year": 2018, "to_year": 2024,
        "participation": "Haiti",
        "who": "North America", "where": "North America",
        "conflict_start": 2018,
        "url": "https://en.wikipedia.org/wiki/2018-present_Haitian_crisis",
    },
    {
        "name": "Chad Insurgency",
        "entities": ["Chad"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Chad",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Boko_Haram_insurgency",
    },
    {
        "name": "Ecuador Violence",
        "entities": ["Ecuador"],
        "from_year": 2019, "to_year": 2024,
        "participation": "Ecuador",
        "who": "South America", "where": "South America",
        "conflict_start": 2019,
        "url": "https://en.wikipedia.org/wiki/2024_Ecuadorian_internal_conflict",
    },
    {
        "name": "Congo (Brazzaville) Conflict",
        "entities": ["Congo"],
        "from_year": 2016, "to_year": 2024,
        "participation": "Republic of the Congo",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2016,
        "url": "https://en.wikipedia.org/wiki/Republic_of_the_Congo",
    },
    {
        "name": "Iran vs Kurdish/Internal Groups",
        "entities": ["Iran"],
        "from_year": 2016, "to_year": 2024,
        "participation": "Iran",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2016,
        "url": "https://en.wikipedia.org/wiki/PJAK_insurgency",
    },
    {
        "name": "Kenya (Al-Shabaab Spillover)",
        "entities": ["Kenya"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Kenya",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Shifta_War",
    },
    {
        "name": "Burundi Crisis",
        "entities": ["Burundi"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Burundi",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Burundian_unrest_(2015-present)",
    },
    {
        "name": "Bangladesh Conflict",
        "entities": ["Bangladesh"],
        "from_year": 2016, "to_year": 2024,
        "participation": "Bangladesh",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2016,
        "url": "https://en.wikipedia.org/wiki/Bangladesh",
    },
    {
        "name": "Benin (Sahel Spillover)",
        "entities": ["Benin"],
        "from_year": 2022, "to_year": 2024,
        "participation": "Benin",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2022,
        "url": "https://en.wikipedia.org/wiki/Islamist_insurgency_in_the_Sahel",
    },
    {
        "name": "Papua New Guinea Tribal Violence",
        "entities": ["Papua New Guinea"],
        "from_year": 2019, "to_year": 2024,
        "participation": "Papua New Guinea",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2019,
        "url": "https://en.wikipedia.org/wiki/Papua_New_Guinea",
    },
    {
        "name": "Togo Armed Conflict",
        "entities": ["Togo"],
        "from_year": 2022, "to_year": 2024,
        "participation": "Togo",
        "who": "Africa", "where": "Africa",
        "conflict_start": 2022,
        "url": "https://en.wikipedia.org/wiki/Togo",
    },
    {
        "name": "Indonesia (Papua Insurgency)",
        "entities": ["Indonesia"],
        "from_year": 2018, "to_year": 2024,
        "participation": "Indonesia",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2018,
        "url": "https://en.wikipedia.org/wiki/Papua_conflict",
    },
    {
        "name": "Saudi-Yemen Border Conflict",
        "entities": ["Saudi Arabia"],
        "from_year": 2015, "to_year": 2023,
        "participation": "Saudi Arabia, Yemen",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Saudi_Arabian-led_intervention_in_Yemen",
    },
    {
        "name": "Honduras Violence",
        "entities": ["Honduras"],
        "from_year": 2015, "to_year": 2023,
        "participation": "Honduras",
        "who": "North America", "where": "North America",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Crime_in_Honduras",
    },
    {
        "name": "Venezuela Violence",
        "entities": ["Venezuela"],
        "from_year": 2015, "to_year": 2023,
        "participation": "Venezuela",
        "who": "South America", "where": "South America",
        "conflict_start": 2015,
        "url": "https://en.wikipedia.org/wiki/Crisis_in_Venezuela",
    },
    {
        "name": "Algeria (Islamist Insurgency cont.)",
        "entities": ["Algeria"],
        "from_year": 2015, "to_year": 2020,
        "participation": "Algeria",
        "who": "Africa", "where": "Africa",
        "conflict_start": 1992,
        "url": "https://en.wikipedia.org/wiki/Islamist_insurgency_in_Algeria",
    },
    {
        "name": "South Thailand Insurgency",
        "entities": ["Thailand"],
        "from_year": 2015, "to_year": 2024,
        "participation": "Thailand",
        "who": "Asia", "where": "Asia",
        "conflict_start": 2004,
        "url": "https://en.wikipedia.org/wiki/South_Thailand_insurgency",
    },
]


def build_notes(conflict, total_deaths, yearly_str):
    """Build notes with per-year breakdown and conflict context."""
    cs = conflict["conflict_start"]
    parts = []
    parts.append(f"Conflict ongoing since {cs}." if conflict["to_year"] >= 2024 else f"Conflict period: {cs}-{conflict['to_year']}.")
    parts.append(f"UCDP deaths {conflict['from_year']}-{conflict['to_year']}: {total_deaths:,}.")
    parts.append(f"Per year: {yearly_str}.")
    parts.append("Source: UCDP/Our World in Data.")
    return " ".join(parts)


# ── Calculate fatalities per conflict ────────────────────────────────
new_entries = []

for conflict in CONFLICTS:
    total_deaths = 0
    yearly_breakdown = {}
    actual_from = 9999
    actual_to = 0

    for entity_name in conflict["entities"]:
        if entity_name not in country_year_data:
            continue
        for y in range(conflict["from_year"], conflict["to_year"] + 1):
            if y in country_year_data[entity_name]:
                d = country_year_data[entity_name][y]
                total_deaths += d
                yearly_breakdown[y] = yearly_breakdown.get(y, 0) + d
                if y < actual_from:
                    actual_from = y
                if y > actual_to:
                    actual_to = y

    if total_deaths < 100:
        continue

    # Use actual data range
    from_year = actual_from
    to_year = actual_to
    duration = to_year - from_year

    # Per-year breakdown string
    yearly_str = ", ".join(f"{y}: {yearly_breakdown[y]:,}" for y in sorted(yearly_breakdown))

    notes = build_notes(conflict, total_deaths, yearly_str)

    num_participants = len(conflict["participation"].split(","))

    entry = {
        "wars": conflict["name"],
        "from": from_year,
        "to": to_year,
        "duration": duration,
        "notes": notes,
        "participation": conflict["participation"],
        " number_participants": num_participants,
        "who": conflict["who"],
        "where": conflict["where"],
        "fatalities": f"{total_deaths:,}",
        "url_source": conflict["name"].replace(" ", "-"),
        "memorials": "",
        "links": conflict["url"],
    }
    new_entries.append(entry)
    print(f"  {conflict['name']:55s} {from_year}-{to_year} dur={duration:>2d}  {total_deaths:>10,d} deaths  who={conflict['who']}")


# ── Read original PoppyDataCSV ────────────────────────────────────────
existing_rows = []
with open(POPPY_ORIGINAL, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        existing_rows.append(row)

print(f"\nOriginal entries: {len(existing_rows)}")
print(f"New entries: {len(new_entries)}")
print(f"Total: {len(existing_rows) + len(new_entries)}")

# Duration distribution of new entries
from collections import Counter
dur_dist = Counter(e["duration"] for e in new_entries)
print(f"\nDuration distribution (new entries):")
for d in sorted(dur_dist):
    print(f"  duration={d}: {dur_dist[d]} entries")


# ── Write combined CSV ────────────────────────────────────────────────
with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for row in existing_rows:
        writer.writerow(row)

    for entry in new_entries:
        writer.writerow(entry)

print(f"\nOutput written to: {OUTPUT_CSV}")
