#!/usr/bin/env bash
set -e

npx better-crowdin upload sources -b ${CIRCLE_BRANCH}