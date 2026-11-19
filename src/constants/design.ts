import type { TextStyle } from 'react-native';

export const colors = {
  background: '#F4F6F9',
  surface: '#FFFFFF',
  border: '#E3E7ED',
  borderStrong: '#D3D9E1',
  divider: '#E5E8EC',

  text: '#141A26',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  placeholder: '#7A818C',

  primary: '#1D4ED8',
  primaryPressed: '#1E40AF',
  primarySoft: '#EEF4FF',
  onPrimary: '#FFFFFF',

  danger: '#C81E1E',
  success: '#047857',
  successSoft: '#ECFDF5',
  successBorder: '#A7F3D0',
  warning: '#B45309',

  photo: '#D8D4CE',
  photoAlt: '#CCD5E0',
  photoWarm: '#E2DACF',
  photoBadge: 'rgba(41, 45, 54, 0.88)',

  map: '#E7EAEE',
  mapRoad: '#FFFFFF',
  mapPark: '#DCE7D9',
} as const;

export const categoryColors = {
  road: '#B91C1C',
  drainage: '#1D4ED8',
  streetlight: '#A15C07',
  sidewalk: '#C2410C',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'SpaceGrotesk_700Bold',
  displaySemibold: 'SpaceGrotesk_600SemiBold',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 32, lineHeight: 37, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.text },
  heading: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.text },
  label: { fontFamily: fonts.semibold, fontSize: 14.5, lineHeight: 20, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: colors.textMuted },
  small: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.textMuted },
} satisfies Record<string, TextStyle>;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
