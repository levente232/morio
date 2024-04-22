#!/bin/bash

# Set up folder
SRC=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && cd ../moriod && pwd )
DIST=/var/nfs/morio/imgs

# Grab the Morio version from package.json
VERSION=`sed 's/\"version\"/\"VERSION\"/' $SRC/../package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`

# Write out control file
cat <<EOF > $SRC/control
Package: moriod
Source: moriod
Version: $VERSION
Section: utils
Priority: optional
Architecture: amd64
Essential: no
Installed-Size: 500000
Maintainer: CERT-EU <services@cert.europa.eu>
Changed-By: Joost De Cock <joost.decock@cert.europa.eu>
Homepage: https://github.com/certeu/morio
Description: Umbrella package for Morio
  Morio is an end-to-end streaming data backbone
  for your observability needs.
Vcs-Git: https://github.com/certeu/morio -b main [clients/linux]
Depends: docker.io, systemd
Uploaders: Joost De Cock <joost.decock@cert.europa.eu>
EOF

# Write out the version EnvironmentFile for systemd
cat <<EOF > $SRC/etc/morio/moriod/version.env
#
# This file is auto-generated by the moriod software pacakge.
# Under normal circumstances, you should not edit it.
#
# This file holds the MORIO_VERSION variable, which controls the morio docker tag systemd will start.
# It is installed/provided by the modiod package and will by updated when you update the package.
#

MORIO_VERSION=$VERSION
EOF

# Write out the vars EnvironmentFile for systemd
cat <<EOF > $SRC/etc/morio/moriod/moriod.env
#
# This file holds environment variables for Morio
# It is used as an EnvironmentFile in the systemd unit file for moriod (Morio Core).
#
# You can (uncomment and) change these values to customize your moriod setup.
#
# However, after Morio has been setup, you should not change
# the various locations with a _ROOT suffix as doing so will break your setup.
#

# Location of the Docker socket
#MORIO_DOCKER_SOCKET="/var/run/docker.sock"

# Node environment
#NODE_ENV="production"

#
# After Morio has been setup, you should not change the variables below.
# Doing so will break your setup.
#

# Location of the Morio configuration folder
#MORIO_CONFIG_ROOT="/etc/morio"

# Location of the Morio data folder
#MORIO_DATA_ROOT="/var/lib/morio"

# Location of the Morio logs folder
#MORIO_LOGS_ROOT="/var/log/morio"

# Log level for Morio core
#MORIO_CORE_LOG_LEVEL="warn"
EOF

# Write out version file
echo $VERSION > $SRC/etc/morio/moriod/version

# Build package
docker run -it \
  --rm \
  -v $SRC:/morio/src \
  -v $DIST:/morio/dist \
  -- \
  morio/dbuilder

