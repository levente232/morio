/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'ui',
  hooks: {
    recreateContainer: () => false,
    restartContainer: () => false,
  },
}
