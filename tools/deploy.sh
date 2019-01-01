#!/usr/bin/env bash

set -e

tools/deploy_chrome.sh
tools/deploy_firefox.sh

# tools/sentry_release.sh