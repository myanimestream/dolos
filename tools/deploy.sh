#!/usr/bin/env bash

set -e

VERSION=$(cat "dist/manifest.json" | jq -r ".version")
RELEASE="dolos@${VERSION}"

echo "Deploying version ${RELEASE}"
mkdir "build"
tools/deploy_chrome.sh
tools/deploy_firefox.sh

npx sentry-cli releases set-commits ${RELEASE} --auto
npx sentry-cli releases deploys ${RELEASE} new -e "production"