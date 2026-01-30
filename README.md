# VRkalender

En svensk kalenderapp för hantering av arbetsscheman, fridagar och ledigheter.

## Funktioner

- 📅 **Kalendervy** - Månadskalender med veckonummer
- 📋 **Listvy** - Översikt av månadens dagar med arbetstider
- 🎉 **Helgdagar** - Svenska och norska helgdagar med OB-information
- 👥 **Profiler** - Hantera flera personers scheman
- 📄 **PDF-import** - Ladda in månadsscheman från PDF-filer
- 📥 **PDF-export** - Exportera årsöversikt som PDF
- 🔑 **Fridagsnyckel** - Automatisk beräkning av FP/FPV-dagar baserat på schema

## Ledighetstyper

| Typ | Beskrivning |
|-----|-------------|
| **FP** | Fridag på helg (grön ram) |
| **FPV** | Fridag på vardag (grön streckad ram) |
| **AFD** | Arbetsförlagd dag (gul streckad ram) |
| **FL** | Föräldraledighet (lila streckad ram) |
| **Sem** | Semester (blå streckad ram) |

## Filstruktur

```
vrkalender/
├── index.html          # Huvudfil
├── css/
│   └── styles.css      # All styling
├── js/
│   └── app.js          # All JavaScript-logik
└── README.md           # Dokumentation
```

## Installation

1. Klona repot:
   ```bash
   git clone https://github.com/ditt-användarnamn/vrkalender.git
   ```

2. Öppna `index.html` i en webbläsare

Alternativt, använd en lokal utvecklingsserver:
```bash
npx serve .
# eller
python -m http.server 8000
```

## Användning

### Lägga till profil
1. Öppna hamburgermenyn (☰)
2. Klicka "Lägg till profil (PDF)"
3. Välj en PDF med månadsschema

### Välja fridagsnyckel
1. Välj en profil
2. Klicka "Välj fridagsnyckel" i headern
3. Välj schema och position i inställningarna
4. Klicka "Applicera schema"

### Markera ledighet
1. Klicka på en dag i kalendern
2. Välj ledighetstyp (FP, FPV, AFD, FL, Semester)

### Exportera PDF
1. Öppna hamburgermenyn
2. Klicka på nedladdningsikonen (↓) bredvid en profil

## Teknologi

- Vanilla JavaScript (ES6+)
- CSS3 med CSS Custom Properties (variabler)
- [jsPDF](https://github.com/parallax/jsPDF) - PDF-generering
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF-parsing
- Google Fonts (DM Sans, Fraunces)

## Dark Mode

Appen stöder automatiskt dark mode baserat på systemets inställningar.

## Version

v0.97

## Licens

MIT
