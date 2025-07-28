# Font Installation Instructions

To use the custom fonts in this project, you need to download the font files and place them in this directory.

## Required Fonts

### 1. MetaAccanthis
**Source:** https://gitlab.com/ameliedumont/fonts/-/tree/master/MetaAccanthis

Download the following files and place them in this `/fonts` directory:
- `MetaAccanthis-Regular.ttf` (or .woff2, .woff if available)
- `MetaAccanthis-Bold.ttf` (or .woff2, .woff if available)
- `MetaAccanthis-Alternate.ttf` (or .woff2, .woff if available)

### 2. Cotham
**Source:** https://github.com/sebsan/Cotham

Download the following files and place them in this `/fonts` directory:
- `Cotham-Regular.ttf` (or .woff2, .woff if available)
- `Cotham-Bold.ttf` (or .woff2, .woff if available)
- `Cotham-Light.ttf` (or .woff2, .woff if available)

## File Structure
After downloading, your fonts directory should look like:
```
/client/src/assets/fonts/
├── fonts.css (already created)
├── README.md (this file)
├── MetaAccanthis-Regular.ttf
├── MetaAccanthis-Bold.ttf
├── MetaAccanthis-Alternate.ttf
├── Cotham-Regular.ttf
├── Cotham-Bold.ttf
└── Cotham-Light.ttf
```

## Font Usage

The fonts are automatically configured to be used as follows:

- **MetaAccanthis Alternate**: Main title "Toronto Event Calendar"
- **MetaAccanthis**: Month titles in calendar picker
- **Cotham**: All subheadings (h1, h2, h3, h4, h5, h6)
- **Cotham**: All body text, buttons, and form elements

## Converting to Web Fonts (Optional)

For better performance, you can convert TTF files to WOFF2/WOFF formats using tools like:
- [FontSquirrel Webfont Generator](https://www.fontsquirrel.com/tools/webfont-generator)
- [CloudConvert](https://cloudconvert.com/ttf-to-woff2)

If you have WOFF2/WOFF versions, place them in the same directory and the CSS will automatically use them (they load faster).

## Fallbacks

If the custom fonts don't load, the system will fall back to:
- **serif** fonts for MetaAccanthis
- **sans-serif** fonts for Cotham