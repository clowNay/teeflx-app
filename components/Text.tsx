import { StyleSheet, Text as RNText, type TextProps } from 'react-native'

/**
 * Text in the TEEFLX fonts (Barlow, Barlow Condensed for display), loaded in app/_layout.tsx.
 * A custom font needs its own family per weight, so fontWeight is turned into the matching
 * Barlow face. Large bold text (headings, amounts, card names) is Barlow Condensed, like the
 * headlines on teeflx.com. Text that sets its own fontFamily (the monospace DGU number) keeps it.
 */
const BARLOW: Record<string, string> = {
  '400': 'Barlow_400Regular',
  '500': 'Barlow_500Medium',
  '600': 'Barlow_600SemiBold',
  '700': 'Barlow_700Bold',
  '800': 'Barlow_700Bold',
  '900': 'Barlow_700Bold',
}

const CONDENSED_FROM_SIZE = 20

// Weights from className (NativeWind) on the few screens that use classes
function classWeight(className?: string): string | undefined {
  if (!className) return undefined
  if (/\bfont-(bold|extrabold|black)\b/.test(className)) return '700'
  if (/\bfont-semibold\b/.test(className)) return '600'
  if (/\bfont-medium\b/.test(className)) return '500'
  return undefined
}

export function Text({ style, ...props }: TextProps & { className?: string }) {
  const flat = StyleSheet.flatten(style) ?? {}
  if (flat.fontFamily) return <RNText style={style} {...props} />

  const raw = flat.fontWeight ?? classWeight(props.className) ?? '400'
  const weight = raw === 'bold' ? '700' : raw === 'normal' ? '400' : String(raw)
  const display = Number(weight) >= 700 && (flat.fontSize ?? 0) >= CONDENSED_FROM_SIZE

  const fontFamily = display ? 'BarlowCondensed_800ExtraBold' : (BARLOW[weight] ?? BARLOW['400'])
  // Barlow sits tighter than the system font, so give text air unless a lineHeight is set
  // (not for className text: its size lives in the class, which we can't read here)
  const sizedByClass = !flat.fontSize && /\btext-(xs|sm|base|lg|\dxl|xl)\b/.test(props.className ?? '')
  const fontSize = flat.fontSize ?? 14
  const lineHeight = flat.lineHeight ?? (sizedByClass ? undefined : Math.round(fontSize * (display ? 1.15 : 1.4)))
  // fontWeight 'normal': the family already is the weight (Android would otherwise fake bold)
  return <RNText style={[style, { fontFamily, fontWeight: 'normal', ...(lineHeight ? { lineHeight } : {}) }]} {...props} />
}
