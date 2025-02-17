#!/usr/bin/env bash
# Enable debug mode
set -x

# Source config variables
echo "Sourcing config variables..."
source config/cli.sh

echo "Removing Docker containers..."
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
  2> /dev/null || true

# echo "Removing Docker network..."
# docker network rm morionet || true

echo "Cleaning up data folder..."
sudo rm -rf ${MORIO_GIT_ROOT}/data/* &> /dev/null || true

# Also remove auto-generated files
echo "Removing auto-generated files..."
rm -f ${MORIO_GIT_ROOT}/clients/linux/etc/morio/audit/config-template.yml &> /dev/null || true
rm -f ${MORIO_GIT_ROOT}/clients/linux/etc/morio/logs/config-template.yml &> /dev/null || true
rm -f ${MORIO_GIT_ROOT}/clients/linux/etc/morio/metrics/config-template.yml &> /dev/null || true

# Disable debug mode
set +x
