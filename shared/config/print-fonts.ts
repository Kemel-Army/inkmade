// INKMADE — большой каталог шрифтов для текста принта (§7.1).
// ~200 семейств Google Fonts. НЕ предзагружаются — шрифт грузится по требованию
// при выборе (app/composables/useFontLoader.ts), иначе страница умрёт под весом.
// cyrillic=true — есть кириллические глифы; иначе предупреждаем при кириллице.

export interface PrintFont {
  name: string
  cyrillic: boolean
}

// Семейства с поддержкой кириллицы на Google Fonts.
const CYRILLIC = new Set<string>([
  'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Oswald', 'Raleway', 'PT Sans', 'PT Serif',
  'Roboto Condensed', 'Roboto Slab', 'Roboto Mono', 'Merriweather', 'Ubuntu', 'Ubuntu Mono',
  'Playfair Display', 'Nunito', 'Nunito Sans', 'Rubik', 'Inter', 'Manrope', 'Fira Sans',
  'Jost', 'Exo 2', 'Exo', 'Comfortaa', 'Pacifico', 'Caveat', 'Lobster', 'Yeseva One',
  'Russo One', 'Play', 'Philosopher', 'Forum', 'Prata', 'Marck Script', 'Pangolin',
  'Cormorant', 'Cormorant Garamond', 'Cormorant Infant', 'EB Garamond', 'Spectral',
  'Vollkorn', 'Alegreya', 'Alegreya Sans', 'Lora', 'Source Sans 3', 'Source Serif 4',
  'Noto Sans', 'Noto Serif', 'Tinos', 'Arsenal', 'Cuprum', 'Didact Gothic', 'El Messiri',
  'Amatic SC', 'Yanone Kaffeesatz', 'Scada', 'Podkova', 'Stalinist One', 'Underdog',
  'Kelly Slab', 'Seymour One', 'Ruslan Display', 'Tenor Sans', 'Andika', 'Pattaya',
  'Bad Script', 'Marmelad', 'Days One', 'Anonymous Pro', 'PT Mono', 'Neucha', 'Literata',
  'Bitter', 'Rubik Mono One', 'Unbounded', 'Golos Text', 'Onest', 'Spectral SC',
  'Old Standard TT', 'Istok Web', 'Jura', 'Lobster Two', 'Poiret One', 'Sansita',
  'Rubik Bubbles', 'Rubik Glitch', 'Rubik Wet Paint', 'Rubik Distressed', 'Rubik Burned',
  'Pridi', 'Geologica', 'IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono', 'Tektur',
])

// Полный список семейств (~200), разные категории.
const FAMILIES: string[] = [
  // sans-serif
  'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Oswald', 'Raleway', 'Poppins', 'Inter',
  'Manrope', 'Nunito', 'Nunito Sans', 'Rubik', 'Work Sans', 'Mulish', 'Karla', 'Jost',
  'PT Sans', 'Fira Sans', 'Ubuntu', 'Exo 2', 'Exo', 'Quicksand', 'Comfortaa', 'Cabin',
  'Barlow', 'Barlow Condensed', 'Hind', 'Heebo', 'Assistant', 'Sora', 'DM Sans', 'Lexend',
  'Outfit', 'Figtree', 'Plus Jakarta Sans', 'Onest', 'Golos Text', 'Geologica', 'Space Grotesk',
  'Schibsted Grotesk', 'Albert Sans', 'Hanken Grotesk', 'Be Vietnam Pro', 'Red Hat Display',
  'Red Hat Text', 'Archivo', 'Archivo Narrow', 'Archivo Black', 'Saira', 'Saira Condensed',
  'Chivo', 'Cabin Condensed', 'Titillium Web', 'Source Sans 3', 'Noto Sans', 'IBM Plex Sans',
  'Public Sans', 'Sarabun', 'Kanit', 'Prompt', 'Mukta', 'Catamaran', 'Rajdhani', 'Teko',
  'Dosis', 'Yanone Kaffeesatz', 'Didact Gothic', 'Istok Web', 'Cuprum', 'Play', 'Jura',
  'Tektur', 'Geo', 'Michroma', 'Orbitron', 'Audiowide', 'Electrolize', 'Aldrich', 'Syncopate',
  // serif
  'Merriweather', 'Playfair Display', 'PT Serif', 'Lora', 'Roboto Slab', 'Bitter', 'Spectral',
  'Vollkorn', 'Cormorant', 'Cormorant Garamond', 'Cormorant Infant', 'EB Garamond', 'Tinos',
  'Source Serif 4', 'Noto Serif', 'IBM Plex Serif', 'Alegreya', 'Crimson Text', 'Crimson Pro',
  'Libre Baskerville', 'Old Standard TT', 'Prata', 'Yeseva One', 'Cardo', 'Domine', 'Arvo',
  'Bree Serif', 'Zilla Slab', 'Aleo', 'Slabo 27px', 'Frank Ruhl Libre', 'Literata', 'Newsreader',
  'Petrona', 'Fraunces', 'Marcellus', 'Cinzel', 'Forum', 'Philosopher', 'Sorts Mill Goudy',
  'Gelasio', 'Rufina', 'Sahitya', 'Spectral SC', 'Playfair Display SC', 'Tenor Sans', 'Arsenal',
  // display / decorative
  'Bebas Neue', 'Anton', 'Archivo Black', 'Russo One', 'Righteous', 'Fjalla One', 'Staatliches',
  'Alfa Slab One', 'Titan One', 'Bungee', 'Bungee Shade', 'Bungee Inline', 'Passion One',
  'Black Ops One', 'Bowlby One', 'Bowlby One SC', 'Luckiest Guy', 'Bangers', 'Fredoka',
  'Baloo 2', 'Lilita One', 'Chango', 'Sigmar One', 'Paytone One', 'Squada One', 'Changa One',
  'Days One', 'Kelly Slab', 'Seymour One', 'Ruslan Display', 'Stalinist One', 'Underdog',
  'Monoton', 'Faster One', 'Wallpoet', 'Megrim', 'Iceberg', 'Iceland', 'Press Start 2P',
  'VT323', 'Silkscreen', 'Pixelify Sans', 'Rubik Mono One', 'Rubik Glitch', 'Rubik Wet Paint',
  'Rubik Burned', 'Rubik Bubbles', 'Rubik Distressed', 'Rubik Spray Paint', 'Rubik Puddles',
  'Unbounded', 'Tektur', 'Bungee Spice', 'Climate Crisis', 'Workbench', 'Honk', 'Sixtyfour',
  'Nabla', 'Codystar', 'Creepster', 'Eater', 'Nosifer', 'Butcherman', 'Metal Mania', 'Pirata One',
  'Ewert', 'Vast Shadow', 'Rye', 'Ultra', 'Special Elite', 'Fascinate', 'Frijole', 'Bungee Hairline',
  // handwriting / script
  'Pacifico', 'Caveat', 'Lobster', 'Lobster Two', 'Dancing Script', 'Great Vibes', 'Satisfy',
  'Sacramento', 'Cookie', 'Allura', 'Parisienne', 'Yellowtail', 'Kaushan Script', 'Courgette',
  'Marck Script', 'Bad Script', 'Pangolin', 'Neucha', 'Amatic SC', 'Shadows Into Light',
  'Indie Flower', 'Permanent Marker', 'Gloria Hallelujah', 'Patrick Hand', 'Architects Daughter',
  'Caveat Brush', 'Reenie Beanie', 'Rock Salt', 'Homemade Apple', 'Nanum Pen Script',
  'Pattaya', 'Marmelad', 'Caveat', 'Sriracha', 'Grand Hotel', 'Tangerine', 'Pinyon Script',
  'Mr Dafoe', 'Damion', 'Niconne', 'League Script', 'Italianno', 'Petit Formal Script',
  // monospace
  'Roboto Mono', 'Space Mono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono',
  'Ubuntu Mono', 'PT Mono', 'Anonymous Pro', 'Inconsolata', 'Cousine', 'Overpass Mono',
  'Major Mono Display', 'Nanum Gothic Coding', 'Cutive Mono', 'Share Tech Mono', 'DM Mono',
]

// уникализируем (некоторые имена встречаются в нескольких категориях)
const UNIQUE = [...new Set(FAMILIES)]

export const PRINT_FONTS: PrintFont[] = UNIQUE.map(name => ({ name, cyrillic: CYRILLIC.has(name) }))

export function isCyrillicFont(name: string): boolean {
  return CYRILLIC.has(name)
}

/** URL css2 для подгрузки семейства (regular + bold). */
export function googleFontHref(name: string): string {
  const fam = name.trim().replace(/\s+/g, '+')
  return `https://fonts.googleapis.com/css2?family=${fam}:wght@400;700&display=swap`
}
