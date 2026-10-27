// VCTC Template_Rise Up.potx: theme1 + the Vivid Neon highlight in slide layouts.
// Keep the original brand swatches; darker UI shades make small text readable.
export const brand = {
  ink: '#002733',
  green: '#008C82',
  soft: '#99D1CD',
  neon: '#C2FE06'
}

const primary = {
  50: '#F0F8F7',
  100: '#E5F3F2',
  200: brand.soft,
  300: '#66BAB3',
  400: '#49B3AA',
  500: brand.green,
  600: '#007A72',
  700: '#00635D',
  800: '#004C47',
  900: '#003A37',
  950: '#002724'
}

export const colors = {
  brand,
  primary,
  secondary: primary,
  info: primary,
  accent: {
    50: '#FAFFE8',
    100: '#F2FFCF',
    200: '#E9FFAA',
    300: '#DBFF70',
    400: '#D0FF3D',
    500: brand.neon,
    // Neon is a highlight, not a text color on white. Use 600+ for light surfaces.
    600: '#657F03',
    700: '#506502',
    800: '#3D4D04',
    900: '#2F3B05',
    950: '#182001'
  },
  surface: {
    50: '#F5F8F8',
    100: '#EAF0F1',
    200: '#CCD3D6',
    300: '#A6B5BA',
    400: '#99A9AD',
    500: '#5A737C',
    600: '#4C6870',
    700: '#34535D',
    800: '#193D47',
    900: brand.ink,
    950: '#001A22'
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03'
  },
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A'
  }
}

// Map SDK graphics need literal colors, so share the UI palette rather than
// maintaining another set of hard-coded greens in mapService.
export const stationColors = {
  available: primary[500],
  busy: colors.warning[500],
  full: colors.danger[500],
  maintenance: colors.surface[500]
}
