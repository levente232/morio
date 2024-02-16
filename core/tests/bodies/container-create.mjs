export default {
  Hostname: 'morio_core_test',
  Env: ['test=true', 'morio=true'],
  Image: 'google/pause:latest',
  Labels: {
    'eu.certeu.morio.test': 'yes',
  },
}
