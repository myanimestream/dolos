#!/usr/bin/env bash
set -e

npx crowdin-cli upload sources -b ${CIRCLE_BRANCH}