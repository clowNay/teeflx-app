/**
 * The TEEFLX look from golfer web (teeflx.com): dark greens, gold, mist.
 * Same values as the flx-* colours in teeflx-golfer's main.css.
 */
export const FLX = {
  green: '#12301f',      // dark sections, primary text on gold
  card: '#1a3c28',       // cards on dark backgrounds
  line: '#2b5139',       // dividers and borders on dark backgrounds
  gold: '#e6cf8a',       // buttons, badges, highlights
  goldDim: 'rgba(230, 207, 138, 0.4)',
  goldSoft: 'rgba(230, 207, 138, 0.25)',  // borders around something gold-tinted
  goldTint: 'rgba(230, 207, 138, 0.12)',  // a highlighted box or icon circle
  mist: '#d5e1d7',       // light text on green
  mistDim: '#9fb2a4',    // quiet text on green
  warning: '#f59e0b',    // warnings stay amber so they stand out
} as const
