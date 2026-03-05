<div align="center">

# 🌺 Cronología de Conflictos Mundiales

### Visualización interactiva de víctimas de conflictos armados (1899–2024)

[![D3.js](https://img.shields.io/badge/D3.js-v3-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)](https://d3js.org/)
[![jQuery](https://img.shields.io/badge/jQuery-1.11-0769AD?style=for-the-badge&logo=jquery&logoColor=white)](https://jquery.com/)
[![UCDP Data](https://img.shields.io/badge/Datos-UCDP%2FOur%20World%20in%20Data-4C8C2B?style=for-the-badge)](https://ourworldindata.org/war-and-peace)
[![Idioma](https://img.shields.io/badge/Idioma-Español-CD6155?style=for-the-badge)]()

<br>

<img src="site/img/PoppyField.jpg" alt="Poppy Field — Visualización de víctimas de guerra" width="700">

<br>

*Cada flor de amapola representa un conflicto armado.  
Su **tamaño** refleja el número de víctimas. Su **posición** marca la duración y el año de finalización.*

</div>

---

## 📖 Descripción

**Cronología de Conflictos Mundiales** es una visualización de datos interactiva que representa **310 conflictos armados** desde 1899 hasta 2024 como flores de amapola (*poppies*), símbolo universal del recuerdo a las víctimas de guerra.

> Basado en el proyecto original [Poppy Field](http://www.poppyfield.org) de Valentina De Filippis y Bj Heinley, extendido con datos actualizados del [Uppsala Conflict Data Program (UCDP)](https://ucdp.uu.se/) a través de [Our World in Data](https://ourworldindata.org/war-and-peace).

### ✨ Características principales

| Característica | Descripción |
|:---|:---|
| 🔍 **Búsqueda en tiempo real** | Busca por país, conflicto o región con autocompletado |
| 🗺️ **Filtro por ubicación** | África, Asia, Europa, Norteamérica, Sudamérica |
| 💀 **Filtro por víctimas** | Rango ajustable de 160 a 50 Millones |
| 📅 **Línea de tiempo** | Slider interactivo de 1899 a 2024 |
| 📊 **Escala log/lineal** | Alterna la escala del eje Y de duración |
| 📋 **Detalle por conflicto** | Panel con duración, víctimas totales, **desglose anual**, ubicación y participantes |
| 🇪🇸 **Interfaz en español** | Todos los nombres de conflictos, países y UI traducidos |

---

## 🗂️ Estructura del Proyecto

```
cronologia-conflictos-mundiales/
│
├── 📄 README.md
├── 📄 .gitignore
│
├── 🌐 site/                          ← Aplicación web (desplegable)
│   ├── index.html                     ← Página principal
│   ├── favicon.ico
│   │
│   ├── css/
│   │   ├── style.css                  ← Estilos principales + búsqueda + muertes anuales
│   │   ├── fonts/                     ← Tipografías (ACaslonPro, CenturyGothic)
│   │   └── libs/                      ← CSS de librerías (jQuery UI, jScrollPane)
│   │       └── images/                ← Imágenes de jQuery UI
│   │
│   ├── js/
│   │   ├── PS.js                      ← Lógica principal de la visualización
│   │   │                                 ├─ PS.Graph          → gráfico D3, ejes, escalas
│   │   │                                 ├─ PS.Graph.Overlay  → panel de detalle
│   │   │                                 ├─ PS.Graph.War      → modelo de datos de conflicto
│   │   │                                 ├─ PS.Graph.Poppy    → SVG por región
│   │   │                                 ├─ PS.Filter.Date    → filtro de línea de tiempo
│   │   │                                 ├─ PS.Filter.Death   → filtro por víctimas
│   │   │                                 ├─ PS.Filter.Region  → filtro por ubicación
│   │   │                                 ├─ PS.Filter.Search  → búsqueda con autocompletado
│   │   │                                 ├─ PS.Filter.Panel   → coordinador de filtros
│   │   │                                 ├─ PS.Animation      → transiciones de estado
│   │   │                                 └─ PS.Controls       → navegación intro/gráfico
│   │   └── libs/                      ← Librerías JavaScript
│   │       ├── d3.min.js              ← D3.js v3 (visualización SVG)
│   │       ├── jquery-1.11.1.min.js   ← jQuery (DOM, eventos, AJAX)
│   │       ├── jquery-ui.min.js       ← jQuery UI (sliders)
│   │       ├── TweenMax.min.js        ← GreenSock (animaciones)
│   │       ├── ScrollToPlugin.min.js  ← GreenSock ScrollTo
│   │       ├── jquery.jscrollpane.min.js ← ScrollPane personalizado
│   │       └── jquery.mousewheel.js   ← Soporte mousewheel
│   │
│   ├── data/
│   │   └── PoppyDataCSV.csv          ← Dataset principal (310 conflictos)
│   │                                     Columnas: wars, from, to, duration, notes,
│   │                                     participation, who, where, fatalities,
│   │                                     url_source, links, yearly_deaths
│   │
│   └── img/
│       ├── PoppyField.jpg            ← Imagen de portada
│       ├── explanation.png           ← Diagrama explicativo
│       ├── the-book.png              ← Imagen del libro
│       ├── skin/                     ← UI assets (fondos, sprites, íconos)
│       └── svg/                      ← Flores SVG por región geográfica
│           ├── Africa.svg
│           ├── Asia.svg
│           ├── Europe.svg
│           ├── Europe-Africa.svg
│           ├── Europe-Asia.svg
│           ├── Global.svg
│           ├── North-America.svg
│           └── South-America.svg
│
└── 🔧 scripts/                       ← Scripts de procesamiento de datos
    ├── regenerate_ucdp_data.py        ← Genera los 48 conflictos UCDP (2015-2024)
    ├── add_yearly_deaths.py           ← Agrega desglose anual de muertes al CSV
    ├── translate_wars.py              ← Traduce 262 nombres de guerras al español
    ├── process_ucdp_data.py           ← Análisis exploratorio de datos UCDP
    ├── verify_ukraine.py              ← Verificación de datos de Ucrania
    └── data-sources/                  ← Datos fuente originales
        ├── PoppyDataCSV_original.csv  ← Dataset original (262 conflictos, inglés)
        ├── wars.csv                   ← Dataset alternativo original
        └── API_VC.BTL.DETH_DS2.../    ← CSV fuente UCDP/Our World in Data
```

---

## 🚀 Ejecución Local

```bash
# Clonar el repositorio
git clone https://github.com/SanMaBruno/cronologia-conflictos-mundiales.git
cd cronologia-conflictos-mundiales

# Opción 1: Python
cd site && python3 -m http.server 8000

# Opción 2: Node.js
npx serve site

# Opción 3: PHP
cd site && php -S localhost:8000
```

Abrir **http://localhost:8000** en el navegador.

> ⚠️ Se requiere un servidor local. Abrir `index.html` directamente no funciona porque D3.js necesita cargar el CSV via HTTP.

---

## 📊 Datos

### Fuentes

| Período | Fuente | Conflictos |
|:---|:---|---:|
| 1899–2014 | [The Polynational War Memorial](http://www.war-memorial.net/) | 262 |
| 2015–2024 | [UCDP / Our World in Data](https://ourworldindata.org/war-and-peace) | 48 |
| **Total** | | **310** |

### Estructura del Dataset (`PoppyDataCSV.csv`)

| Campo | Descripción | Ejemplo |
|:---|:---|:---|
| `wars` | Nombre del conflicto (español) | Guerra ruso-ucraniana |
| `from` | Año de inicio | 2015 |
| `to` | Año de finalización | 2024 |
| `duration` | Duración en años | 9 |
| `fatalities` | Total de víctimas | 240,109 |
| `where` | Región geográfica | Europe |
| `participation` | Países participantes | Ucrania, Rusia |
| `yearly_deaths` | Desglose anual (UCDP) | 2022:92608;2023:75393;2024:68116 |
| `notes` | Observaciones | Fuente: UCDP |
| `links` | URL de referencia | https://... |

---

## 🔧 Scripts de Datos

Los scripts en `scripts/` permiten regenerar y actualizar el dataset:

```bash
# Regenerar los 48 conflictos UCDP desde la fuente
python3 scripts/regenerate_ucdp_data.py

# Agregar desglose de muertes anuales
python3 scripts/add_yearly_deaths.py

# Traducir nombres de guerras al español
python3 scripts/translate_wars.py
```

> Todos los scripts leen desde `scripts/data-sources/` y escriben en `site/data/PoppyDataCSV.csv`.

---

## 🎨 Cómo Funciona la Visualización

<div align="center">

```
     DURACIÓN (años)
     ▲
     │
  30 │          🌺 (WW2: 50M víctimas)
     │       ╱
  10 │    🌺╱ (WW1: 10.6M)
     │   ╱
   1 │  🌸 (Golpe militar en Chile: 2,095)
     │╱
     └──────────────────────────────────▶ AÑO FIN
       1899                          2024
```

</div>

| Eje / Propiedad | Significado |
|:---|:---|
| **Eje X** | Año de finalización del conflicto |
| **Eje Y** | Duración en años (escala logarítmica) |
| **Tamaño** de la flor | Número de víctimas (escala raíz cuadrada) |
| **Color / SVG** de la flor | Región geográfica del conflicto |
| **Tallo** | Curva desde el año de inicio hasta el de fin |

---

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|:---|:---|:---|
| [D3.js](https://d3js.org/) | v3 | Gráfico SVG, escalas, ejes, carga de CSV |
| [jQuery](https://jquery.com/) | 1.11.1 | DOM, eventos, sistema de eventos personalizado |
| [jQuery UI](https://jqueryui.com/) | — | Sliders (timeline y filtro de muertes) |
| [GreenSock (GSAP)](https://greensock.com/) | TweenMax | Animaciones fluidas y transiciones |
| [jScrollPane](http://jscrollpane.kelvinluck.com/) | — | Scroll personalizado en panel de participantes |
| Python 3 | — | Scripts de procesamiento y traducción de datos |

---

## 📝 Créditos

- **Concepto y diseño original:** [Valentina De Filippis](https://twitter.com/defilippovale) & Bj Heinley
- **Desarrollo original:** [Intoloop](http://intoloop.com)
- **Extensión y traducción (2015-2024):** Bruno San Martín — datos UCDP, búsqueda, filtros, interfaz en español
- **Datos:** [UCDP](https://ucdp.uu.se/) | [Our World in Data](https://ourworldindata.org/war-and-peace) | [The Polynational War Memorial](http://www.war-memorial.net/)

---

<div align="center">

*"La guerra no decide quién tiene razón, solo quién queda."*  
— Bertrand Russell

<br>

<img src="site/img/explanation.png" alt="Cómo leer la visualización" width="160">

</div>
