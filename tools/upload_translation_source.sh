#!/usr/bin/env bash
set -e

crowdin-cli upload sources -b ${CIRCLE_BRANCH}