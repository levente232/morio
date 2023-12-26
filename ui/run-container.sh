#!/bin/bash

#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigured' runs.
# To make changes, see: scripts/reconfigure.mjs
#

docker network create morio-net
docker stop ui
docker rm ui

if [ -z "$1" ];
then
  echo ""
  echo "No request to attach to container. Starting in daemonized mode."
  echo "To attach, pass attach to this script: run-container.sh attach "
  echo ""
  docker run -d   --name=ui \
  --network=morio-net \
  --init \
  -v /home/joost/git/morio:/morio  \
  morio/ui-dev:0.1.0

else
  docker run --rm -it   --name=ui \
  --network=morio-net \
  --init \
  -v /home/joost/git/morio:/morio  \
  morio/ui-dev:0.1.0

fi
