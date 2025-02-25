/**
 * This is a theme file for DaisyUI for Moriohub
 */

/*
 * We're using the TailwindCSS colors.
 * Let's include them so we can reference them by name.
 * For a full list, see: https://tailwindcss.com/docs/customizing-colors
 */
import colors from 'tailwindcss/colors'

/*
 * This export is the DaisyUI theme
 */
export const theme = {
  /* FONTS
   *
   * This will apply to everything except code blocks
   * Note that we're using a system font stack here.
   * That means we're not loading any fonts in the browser,
   * but rather relying on what the user has available locally.
   *
   * You can get more font stacks here: https://modernfontstacks.com/
   */
  fontFamily: 'system-ui, sans-serif',

  /* COLORS
   *
   * These names are a bit 'bootstrap' like, which can be misleading.
   * We don't really use primary and secondary colors, nor do we have
   * a warning color and so on.
   * However, these names are used under the hood by TailwindCSS
   * and DaisyUI, so we're stuck with them.
   *
   * Read the descriptions below to understand what each color is used for.
   */

  // base-100: The default background color for a regular page (docs and so on)
  'base-100': colors.neutral['50'],
  // base-200: A slightly darker background color, used for hovers and so on
  'base-200': colors.neutral['100'],
  // base-300: A shade midway between dark and light
  'base-300': colors.neutral['300'],
  // base-content: The default text color for a regular page (docs and so on)
  'base-content': colors.neutral['700'],

  // primary: The main brand color and color of the primary button
  primary: '#1b88a2',
  // primary-focus: The :hover color for the primary button
  'primary-focus': '#3aa6c0',
  // primary-content: The text color on a primary button
  'primary-content': '#ffffff',

  // secondary: The link color on default backgrounds (base-100)
  secondary: '#ffb703',
  // secondary-focus: The :hover link color for default backgrounds. Or:
  // secondary-focus: An alternative link color when on dark backgrounds
  'secondary-focus': '#ffb703',
  // secondary-content: The text color on a secondary button
  'secondary-content': colors.neutral['50'],

  // accent: The accent color is used to highlight active things
  // Should be something that is positive/neutral. Avoid red or orange.
  accent: colors.fuchsia['600'],
  // accent-focus: The :hover color for the accent button
  'accent-focus': colors.fuchsia['500'],
  // accent-content: The text color for the accent button
  'accent-content': colors.neutral['50'],

  // neutral: Used as the background for the footer and navigation on desktop
  // Should always be dark
  neutral: colors.neutral['900'],
  // neutral-focus: Typically a shade lighter than neutral
  'neutral-focus': colors.neutral['700'],
  // neutral-content: The text color on neutral backgrounds
  'neutral-content': colors.neutral['50'],

  // info: Used rarely, can be another color; best somewhat neutral-looking
  // and which would work well with the default text color
  info: colors.indigo['600'],
  // Text color on info
  'info-content': colors.neutral[50],

  // success: Used rarely, but if it is, it's in notifications, indicating success
  // Typically some shade of green
  success: colors.green['600'],
  // Text color on success
  'success-content': colors.neutral[50],

  // warning: We don't do warnings, but this is used for the tabs under code blocks
  // and a couple of other UI elements.
  warning: colors.orange['600'],
  // Text color on warning
  'warning-content': colors.neutral[50],

  // error: Used rarely, but if it is, it's in notifications, indicating failure,
  // or in the 'Danger' button
  // Typically some shade of red
  error: colors.red['600'],
  // Text color on error
  'error-content': colors.neutral[50],

  /* CODE HIGHLIGHTING COLORS
   *
   * These are variables to style highlighted code blocks.
   *
   * Specifically this first set applies to the wrapper around
   * the highlighted code.
   * The names should (hopefully) speak for themselves
   */
  '--code-background-color': colors.neutral['800'],
  '--code-background-highlight-color': '#313131',
  '--code-border-color': colors.neutral['900'],
  '--code-color': colors.neutral['100'],
  '--code-font-family': `"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`,
  '--code-border-radius': '0.5rem',
  '--code-border-style': 'solid',
  '--code-border-width': 1,
  '--code-outer-padding': '0 0.5rem',
  '--code-inner-padding': '1rem',
  /*
   * These variables are used to style the highlighted tokens themselves
   */
  '--code-color-keyword': colors.yellow['500'],
  '--code-font-weight-keyword': 'bold',
  '--code-color-entity': colors.violet['400'],
  '--code-font-weight-entity': 'bold',
  '--code-color-constant': colors.lime['400'],
  '--code-color-string': colors.sky['400'],
  '--code-font-style-string': 'italic',
  '--code-color-variable': colors.indigo['400'],
  '--code-color-comment': colors.neutral['400'],
  '--code-color-tag': colors.green['400'],
  '--code-color-property': colors.yellow['200'],
  '--code-font-weight-property': 'bold',

  /* VARIOUS
   *
   * These are additional variables to control other aspects of the theme
   */
  // border-radius for cards and other big elements
  '--rounded-box': '0.5rem',
  // border-radius for buttons and similar elements
  '--rounded-btn': '0.5rem',
  // border-radius for badges and other small elements
  '--rounded-badge': '1.9rem',
  // bounce animation time for button
  '--animation-btn': '0.25s',
  // bounce animation time for checkbox, toggle, etc.
  '--animation-input': '.4s',
  // default card-body padding
  '--padding-card': '2rem',
  // default text case for buttons
  '--btn-text-case': 'uppercase',
  // default padding for navbar
  '--navbar-padding': '.5rem',
  // default border size for button
  '--border-btn': '1px',
  // focus ring size for button and inputs
  '--focus-ring': '2px',
  // focus ring offset size for button and inputs
  '--focus-ring-offset': '2px',
}
