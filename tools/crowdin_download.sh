#!/usr/bin/env bash

# export translations
curl \
  -F "json=true" \
  -F "branch=${CIRCLE_BRANCH}" \
  "https://api.crowdin.com/api/project/${CROWDIN_PROJECT_IDENTIFIER}/export?key=${CROWDIN_API_KEY}"

wget \
  -qO /tmp/crowdin-$$.zip \
  "https://api.crowdin.com/api/project/${CROWDIN_PROJECT_IDENTIFIER}/download/all.zip?key=${CROWDIN_API_KEY}&branch=${CIRCLE_BRANCH}"

unzip -d dist/_locales/ /tmp/crowdin-$$.zip

rm /tmp/crowdin-$$.zip