#!/usr/bin/env bash
# Source config variables
source config/cli.sh
#
# Check that an environment was specified
if [ -z "$2" ];
then
  echo ""
  echo "No target environment specified, will default to development."
  echo "Building container for Morio development environment."
  echo ""
  RELEASE_CHANNEL="dev"
  RELEASE_CHANNEL_TAG="dev"
  NAMESPACE="devmorio"
  TAG_SUFFIX=""
else
  if [ "stable" == $2 ]
  then
    echo ""
    echo "Building container in channel: stable"
    echo ""
    RELEASE_CHANNEL="stable"
    RELEASE_CHANNEL_TAG="latest"
    NAMESPACE="itsmorio"
    TAG_SUFFIX=""
  elif [ "canary" == $2 ]
  then
    echo ""
    echo "Building container in channel: canary"
    echo ""
    RELEASE_CHANNEL="canary"
    RELEASE_CHANNEL_TAG="canary"
    NAMESPACE="itsmorio"
    TAG_SUFFIX="-canary"
  elif [ "testing" == $2 ]
  then
    echo ""
    echo "Building container in channel:  testing"
    echo ""
    RELEASE_CHANNEL="testing"
    RELEASE_CHANNEL_TAG="testing"
    NAMESPACE="itsmorio"
    TAG_SUFFIX="-$(git rev-parse HEAD)"
  else
    echo ""
    echo "Building container for Morio development environment."
    echo ""
    RELEASE_CHANNEL="dev"
    RELEASE_CHANNEL_TAG="dev"
    NAMESPACE="itsmorio"
    TAG_SUFFIX="-dev"
  fi
fi

# Check that a name was passed of which container to build
if [ -z "$1" ];
then
  echo "Please specify which container to build as a parameter to this script. Eg:"
  echo "build-container.sh api"
  exit 0
else
  # Container to build
  CONTAINER="$1"

  # If building core, build the clients first
  if [[ "$CONTAINER" == "core" ]]; then
    # But not for dev
    if [[ "$RELEASE_CHANNEL" == "dev" ]]; then
      echo "Skipping client build for dev"
    else
      npm run build:clients
    fi
  fi

  # Keep coverage reports out of the build
  cd $MORIO_GIT_ROOT/$1
  sudo rm -rf ./coverage

  # Now build the container
  tar -ch . | docker build \
    --file Containerfile.$RELEASE_CHANNEL \
    --tag $NAMESPACE/$CONTAINER:$RELEASE_CHANNEL_TAG \
    --tag $NAMESPACE/$CONTAINER:$MORIO_VERSION_TAG$TAG_SUFFIX \
    -
fi

