#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

docker rm -fv \
  morio-core \
  morio-api \
  morio-ui \
  morio-proxy \
  morio-ca \
  morio-broker \
  morio-console \
  morio-connector \
  morio-db \
  morio-ldap \
  morio-watcher \
  morio-web \
  morio-tap \
  morio-cache \
  ldap \
  2> /dev/null
docker network rm morionet
sudo rm -rf ${MORIO_GIT_ROOT}/data/* &> /dev/null
# Also remove auto-generated files
rm -f ${MORIO_GIT_ROOT}/clients/linux/etc/morio/audit/config-template.yml &> /dev/null
rm -f ${MORIO_GIT_ROOT}/clients/linux/etc/morio/logs/config-template.yml &> /dev/null
rm -f ${MORIO_GIT_ROOT}/clients/linux/etc/morio/metrics/config-template.yml &> /dev/null
