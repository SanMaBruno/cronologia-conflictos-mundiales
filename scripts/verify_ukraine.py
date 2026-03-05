import csv

with open('data/PoppyDataCSV.csv') as f:
    for r in csv.DictReader(f):
        if 'ucraniana' in r['wars'].lower() or 'ucrania' in r['wars'].lower():
            print(f"{r['wars']:45s} | {r['from']}-{r['to']} | fatalities={r['fatalities']}")

print()
print('=== UCDP SOURCE: Ukraine per year ===')
ucdp = 'scripts/data-sources/API_VC.BTL.DETH_DS2_es_csv_v2_32063/deaths-in-armed-conflicts-based-on-where-they-occurred.csv'
total = 0
with open(ucdp) as f:
    for r in csv.DictReader(f):
        if r['Entity'] == 'Ukraine':
            deaths = int(float(r['Deaths in ongoing conflicts (best estimate) - Conflict type: all']))
            total += deaths
            print(f"  Ukraine {r['Year']}: {deaths:>10,}")

print(f"\n  TOTAL 2015-2024: {total:>10,}")
print(f"  2024 only:       {68116:>10,}")
