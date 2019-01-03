#!/usr/bin/env bash

set -e

VERSION=$(cat "dist/manifest.json" | jq -r ".version")
RELEASE="dolos@${VERSION}"

echo "Deploying version ${RELEASE}"

tools/deploy_chrome.sh
tools/deploy_firefox.sh
rm -rf build

npx sentry-cli releases set-commits ${RELEASE} --auto
npx sentry-cli releases deploys ${RELEASE} new -e "production"