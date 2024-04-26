#!/bin/bash
#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigure' runs.
# To make changes, see: scripts/reconfigure.mjs
#

#
# Need some extra work to ensure that:
#   - There is no API container running
#   - The morionet network is available so we can attach to it
#   - The reporter inside our test container has permissions to write coverage output
#
docker rm -f api
docker network create morionet
sudo rm -rf ./api/coverage/*
mkdir ./api/coverage/tmp
sudo chown 2112:2112 ./api/coverage/tmp


docker run \
  -it --rm \
  --name=api \
  --hostname=api \
  --label morio.service=api \
  --log-driver=journald \
  --log-opt labels=morio.service \
  --network morionet \
  --network-alias api \
  --init \
 \
  -v /home/jdecock/git/morio/data/config/shared:/etc/morio/shared  \
  -v /home/jdecock/git/morio/data/data/downloads:/morio/downloads  \
  -v /home/jdecock/git/morio:/morio  \
  -l "traefik.enable=true"  \
  -l "traefik.docker.network=morionet"  \
  -l "traefik.http.routers.api.rule=(PathPrefix(\`/-/api\`, \`/downloads\`, \`/coverage\`))"  \
  -l "traefik.http.routers.api.priority=100"  \
  -l "traefik.http.routers.api.service=api"  \
  -l "traefik.http.routers.api.entrypoints=https"  \
  -l "traefik.http.services.api.loadbalancer.server.port=3000"  \
  -l "traefik.http.routers.api.tls=true"  \
  -l "traefik.http.middlewares.auth.forwardauth.address=http://api:3000/auth"  \
  -l "traefik.http.middlewares.auth.forwardauth.authResponseHeadersRegex=^X-Morio-"  \
  -l "traefik.http.routers.api.middlewares=auth@docker"  \
  -l "traefik.http.routers.api.tls=true"  \
  -l "traefik.http.routers.api.tls.certresolver=ca"  \
  -l "traefik.http.services.api.loadbalancer.server.port=3000"  \
  -l "traefik.tls.stores.default.defaultgeneratedcert.domain.main=unit.test.morio.it"  \
  -l "traefik.tls.stores.default.defaultgeneratedcert.domain.sans=unit.test.morio.it"  \
  -l "traefik.tls.stores.default.defaultgeneratedcert.resolver=ca"  \
  -e MORIO_DOCKER_SOCKET=/var/run/docker.sock \
  -e MORIO_CONFIG_ROOT=/home/jdecock/git/morio/data/config \
  -e MORIO_DATA_ROOT=/home/jdecock/git/morio/data/data \
  -e MORIO_LOGS_ROOT=/home/jdecock/git/morio/data/logs \
  -e MORIO_CORE_LOG_LEVEL=trace \
  -e NODE_ENV=test \
  -e MORIO_REPO_ROOT=/home/jdecock/git/morio \
  morio/api-test:0.1.6 bash /morio/api/tests/run-unit-tests.sh

