/**
 * This is a theme file for the morio UI
 *
 * See the light theme file for inline comments
 */
import colors from 'tailwindcss/colors'

const c = {
  light: '#8ecae6',
  mid: '#219ebc',
  dark: '#0A0A0A',
  accent1: '#ffb703',
  accent2: '#fb8500',
  bg: '#004252',
  white: '#F5F5F5',
}

export const theme = {
  fontFamily: `Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, system-ui, sans-serif`,

  'base-100': c.bg,
  'base-200': colors.neutral['700'],
  'base-300': colors.neutral['600'],
  'base-content': colors.neutral['200'],

  primary: c.mid,
  'primary-content': c.bg,

  secondary: colors.teal['500'], //c.light,
  'secondary-focus': colors.teal['500'],
  'secondary-content': colors.teal['900'],

  accent: c.accent1,
  'accent-focus': colors.fuchsia['300'],
  'accent-content': colors.neutral['900'],

  neutral: c.dark,
  'neutral-focus': colors.neutral['700'],
  'neutral-content': c.white,

  info: colors.sky['400'],
  success: colors.green['400'],
  warning: colors.orange['400'],
  error: colors.red['400'],

  'info-content': colors.neutral[900],
  'success-content': colors.neutral[900],
  'warning-content': colors.neutral[900],
  'error-content': colors.neutral[900],

  '--morio-heading': c.light,
  '--morio-link': c.light,
  '--morio-light': '#8ecae6',
  '--morio-mid': '#219ebc',
  '--morio-dark': '#023047',
  '--morio-accent1': '#ffb703',
  '--morio-accent2': '#fb8500',
  '--morio-bg': '#001d2d',

  '--code-background-color': '#111',
  '--code-background-highlight-color': '#191919',
  '--code-border-color': colors.neutral['800'],
  '--code-color': colors.neutral['300'],
  '--code-font-family': `"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`,
  '--code-border-radius': '0.5rem',
  '--code-border-style': 'solid',
  '--code-border-width': 2,
  '--code-outer-padding': '0 0.5rem',
  '--code-inner-padding': '1rem',
  '--code-color-keyword': colors.yellow['500'],
  '--code-font-weight-keyword': 'bold',
  '--code-color-entity': colors.violet['400'],
  '--code-font-weight-entity': 'bold',
  '--code-color-constant': colors.lime['300'],
  '--code-color-string': colors.sky['300'],
  '--code-font-style-string': 'italic',
  '--code-color-variable': colors.indigo['300'],
  '--code-color-comment': colors.neutral['400'],
  '--code-color-tag': colors.green['600'],
  '--code-color-property': colors.yellow['200'],
  '--code-font-weight-property': 'bold',

  '--rounded-box': '0.5rem',
  '--rounded-btn': '0.5rem',
  '--rounded-badge': '1.9rem',
  '--animation-btn': '0.25s',
  '--animation-input': '.4s',
  '--padding-card': '2rem',
  '--btn-text-case': 'uppercase',
  '--navbar-padding': '.5rem',
  '--border-btn': '1px',
  '--focus-ring': '2px',
  '--focus-ring-offset': '2px',
}
