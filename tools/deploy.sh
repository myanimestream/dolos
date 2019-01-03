#!/usr/bin/env bash

set -e

VERSION=$(cat "dist/manifest.json" | jq -r ".version")

echo "Deploying version ${VERSION}"

tools/deploy_chrome.sh
tools/deploy_firefox.sh
rm -rf build

npx sentry-cli releases set-commits --auto
npx sentry-cli releases deploys "dolos@${VERSION}" new -e "production"