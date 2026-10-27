import { Easing } from 'react-native-reanimated';
import palette from '../theme/palette.json';

export const DesignTokens = {
  // Spacing (in pixels)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48
  },

  // Border radius (in pixels)
  radius: {
    sm: 8,
    default: 12,
    card: 12,
    lg: 16,
    sheet: 20,
    full: 9999
  },

  // Typography - Jobsian hierarchy
  typography: {
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700' as const,
      letterSpacing: 0.37
    },
    title1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: 0.36
    },
    title2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      letterSpacing: 0.35
    },
    title3: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600' as const,
      letterSpacing: 0.38
    },
    headline: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.41
    },
    body: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400' as const,
      letterSpacing: -0.41
    },
    callout: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '400' as const,
      letterSpacing: -0.32
    },
    subhead: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: -0.24
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
      letterSpacing: -0.08
    },
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0
    },
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '400' as const,
      letterSpacing: 0.06
    }
  },

  // Colors. The raw values live in src/theme/palette.json, which the Tailwind
  // config reads too, so there is one place to change a colour. Nothing outside
  // that file or this one should contain a hex value.
  colors: {
    // Primary system colors
    accent: palette.ios.blue,
    primary: palette.ios.blue,

    // Semantic colors
    success: palette.ios.green,
    warning: palette.ios.orange,
    danger: palette.ios.red,

    // Neutral colors
    graphite: palette.ios.graphite,
    grey: palette.ios.grey,
    lightGrey: palette.ios.lightGrey,
    superLightGrey: palette.ios.superLightGrey,
    white: palette.white,
    black: palette.black,

    // The blue/ink colours the screens use through Tailwind classes
    brand: palette.brand,
    text: palette.text,
    surface: palette.surface,
    line: palette.line,
    red: palette.red,
    amber: palette.amber,
    green: palette.green,
    purple: palette.purple,
    violet: palette.violet,
    indigo: palette.indigo,
    gold: palette.gold,
    avatar: palette.avatar,
    overlay: palette.overlay,

    // Legacy support
    ink: {
      900: palette.ios.graphite,
      600: palette.ios.grey
    }
  },

  // Shadows - Jobsian elevation
  shadows: {
    sm: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    default: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2
    },
    md: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4
    },
    lg: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8
    }
  },

  // Motion easing
  motion: {
    fast: 120,
    default: 220,
    slow: 320,
    easing: [0.2, 0.8, 0.2, 1] as const
  },

  // Animation presets
  animations: {
    pageTurn: {
      damping: 20,
      stiffness: 90,
      mass: 1,
    },
    cardPress: {
      damping: 15,
      stiffness: 450,
    },
    fadeIn: {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    },
    slideIn: {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    },
    spring: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    float: {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    },
  },

  // Touch targets
  touch: {
    minSize: 44
  }
} as const;