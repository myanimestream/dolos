#!/usr/bin/env bash

set -e

# currently not active!

npm i @sentry/cli

VERSION=$(npx sentry-cli releases propose-version)

npx sentry-cli releases new -p dolos ${VERSION}
npx sentry-cli releases set-commits --auto ${VERSION}

npx sentry-cli releases deploys VERSION new -e production