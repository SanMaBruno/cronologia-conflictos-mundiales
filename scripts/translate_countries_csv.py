#!/usr/bin/env python3
"""
Script para traducir todos los nombres de países de inglés a español
en el archivo PoppyDataCSV.csv
"""

import re

# Diccionario de traducciones inglés -> español
translations = {
    'Ukraine': 'Ucrania',
    'United Arab Emirates': 'Emiratos Árabes Unidos',
    'Sweden': 'Suecia',
    'Slovenia': 'Eslovenia',
    'Slovakia': 'Eslovaquia',
    'Singapore': 'Singapur',
    'Norway': 'Noruega',
    'New Zealand': 'Nueva Zelanda',
    'Luxembourg': 'Luxemburgo',
    'Iceland': 'Islandia',
    'Denmark': 'Dinamarca',
    'Czech Republic': 'República Checa',
    'Canada': 'Canadá',
    'Bulgaria': 'Bulgaria',
    'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
    'Austria': 'Austria',
    'Australia': 'Australia',
    'Armenia': 'Armenia',
    'Bahrain': 'Baréin',
    'Georgia': 'Georgia',
    'Tonga': 'Tonga',
    'Montenegro': 'Montenegro',
    'Mongolia': 'Mongolia',
    'North America': 'Norteamérica',
    'South America': 'Sudamérica',
    'Europe': 'Europa',
    'Africa': 'África',
    'United States': 'Estados Unidos',
    'United Kingdom': 'Reino Unido',
    'Soviet Union': 'Unión Soviética',
    'Poland': 'Polonia',
    'Germany': 'Alemania',
    'France': 'Francia',
    'Italy': 'Italia',
    'Spain': 'España',
    'Japan': 'Japón',
    'China': 'China',
    'Russia': 'Rusia',
    'India': 'India',
    'Brazil': 'Brasil',
    'Mexico': 'México',
    'Argentina': 'Argentina',
    'Chile': 'Chile',
    'Colombia': 'Colombia',
    'Peru': 'Perú',
    'Venezuela': 'Venezuela',
    'Cuba': 'Cuba',
    'Egypt': 'Egipto',
    'South Africa': 'Sudáfrica',
    'Nigeria': 'Nigeria',
    'Kenya': 'Kenia',
    'Morocco': 'Marruecos',
    'Algeria': 'Argelia',
    'Tunisia': 'Túnez',
    'Libya': 'Libia',
    'Sudan': 'Sudán',
    'South Sudan': 'Sudán del Sur',
    'Ethiopia': 'Etiopía',
    'Somalia': 'Somalia',
    'Iraq': 'Irak',
    'Iran': 'Irán',
    'Syria': 'Siria',
    'Lebanon': 'Líbano',
    'Israel': 'Israel',
    'Palestine': 'Palestina',
    'Jordan': 'Jordania',
    'Saudi Arabia': 'Arabia Saudita',
    'Yemen': 'Yemen',
    'Oman': 'Omán',
    'Kuwait': 'Kuwait',
    'Qatar': 'Catar',
    'Turkey': 'Turquía',
    'Greece': 'Grecia',
    'Cyprus': 'Chipre',
    'Serbia': 'Serbia',
    'Croatia': 'Croacia',
    'Kosovo': 'Kosovo',
    'Albania': 'Albania',
    'Romania': 'Rumanía',
    'Hungary': 'Hungría',
    'Portugal': 'Portugal',
    'Netherlands': 'Países Bajos',
    'Belgium': 'Bélgica',
    'Switzerland': 'Suiza',
    'Ireland': 'Irlanda',
    'Scotland': 'Escocia',
    'Wales': 'Gales',
    'Finland': 'Finlandia',
    'Lithuania': 'Lituania',
    'Latvia': 'Letonia',
    'Estonia': 'Estonia',
    'Belarus': 'Bielorrusia',
    'Moldova': 'Moldavia',
    'Azerbaijan': 'Azerbaiyán',
    'Kazakhstan': 'Kazajistán',
    'Uzbekistan': 'Uzbekistán',
    'Turkmenistan': 'Turkmenistán',
    'Tajikistan': 'Tayikistán',
    'Kyrgyzstan': 'Kirguistán',
    'Afghanistan': 'Afganistán',
    'Pakistan': 'Pakistán',
    'Bangladesh': 'Bangladés',
    'Sri Lanka': 'Sri Lanka',
    'Nepal': 'Nepal',
    'Myanmar': 'Myanmar',
    'Burma': 'Birmania',
    'Thailand': 'Tailandia',
    'Vietnam': 'Vietnam',
    'Cambodia': 'Camboya',
    'Laos': 'Laos',
    'Malaysia': 'Malasia',
    'Indonesia': 'Indonesia',
    'Philippines': 'Filipinas',
    'Taiwan': 'Taiwán',
    'South Korea': 'Corea del Sur',
    'North Korea': 'Corea del Norte',
    'Democratic Republic of the Congo': 'República Democrática del Congo',
    'Republic of the Congo': 'República del Congo',
    'Central African Republic': 'República Centroafricana',
    'Ivory Coast': 'Costa de Marfil',
    'Burkina Faso': 'Burkina Faso',
    'Mali': 'Malí',
    'Niger': 'Níger',
    'Chad': 'Chad',
    'Cameroon': 'Camerún',
    'Ghana': 'Ghana',
    'Senegal': 'Senegal',
    'Guinea': 'Guinea',
    'Sierra Leone': 'Sierra Leona',
    'Liberia': 'Liberia',
    'Eritrea': 'Eritrea',
    'Djibouti': 'Yibuti',
    'Uganda': 'Uganda',
    'Rwanda': 'Ruanda',
    'Burundi': 'Burundi',
    'Tanzania': 'Tanzania',
    'Mozambique': 'Mozambique',
    'Zimbabwe': 'Zimbabue',
    'Botswana': 'Botsuana',
    'Namibia': 'Namibia',
    'Angola': 'Angola',
    'Zambia': 'Zambia',
    'Malawi': 'Malaui',
    'Madagascar': 'Madagascar',
    'Mauritius': 'Mauricio',
    'Seychelles': 'Seychelles',
    'Comoros': 'Comoras',
    'Cape Verde': 'Cabo Verde',
    'Equatorial Guinea': 'Guinea Ecuatorial',
    'Gabon': 'Gabón',
    'Sao Tome and Principe': 'Santo Tomé y Príncipe',
    'Mauritania': 'Mauritania',
    'Western Sahara': 'Sáhara Occidental',
    'Gambia': 'Gambia',
    'Guinea-Bissau': 'Guinea-Bisáu',
    'Togo': 'Togo',
    'Benin': 'Benín',
    'Lesotho': 'Lesoto',
    'Eswatini': 'Esuatini',
    'Swaziland': 'Suazilandia',
}

def translate_file(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ordenar traducciones por longitud (más largas primero) para evitar reemplazos parciales
    sorted_translations = sorted(translations.items(), key=lambda x: len(x[0]), reverse=True)
    
    for english, spanish in sorted_translations:
        # Usar regex con word boundary para evitar reemplazos parciales
        # Pero ser cuidadoso con países seguidos de coma o espacio
        pattern = r'\b' + re.escape(english) + r'\b'
        content = re.sub(pattern, spanish, content)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Archivo traducido guardado en: {output_path}")

if __name__ == "__main__":
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', 'data')
    
    input_file = os.path.join(data_dir, 'PoppyDataCSV.csv')
    output_file = os.path.join(data_dir, 'PoppyDataCSV.csv')
    
    translate_file(input_file, output_file)
