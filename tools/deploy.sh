#!/usr/bin/env bash
set -e

if [[ ! -d "build" ]]; then
  echo "No build directory. Make sure to build first"
  exit 1
fi

VERSION=$(cat "dist/manifest.json" | jq -r ".version")
RELEASE="dolos@${VERSION}"

echo "Deploying version ${RELEASE}"
tools/deploy_chrome.sh
tools/deploy_firefox.sh

npx sentry-cli releases set-commits ${RELEASE} --auto
npx sentry-cli releases deploys ${RELEASE} new -e "production"