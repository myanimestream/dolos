#!/usr/bin/env bash

# export translations
curl \
  -F "json=true" \
  -F "branch=${CIRCLE_BRANCH}" \
  "https://api.crowdin.com/api/project/${CROWDIN_PROJECT_IDENTIFIER}/export?key=${CROWDIN_API_KEY}"

# download translation to temp file
wget \
  -qO /tmp/crowdin-$$.zip \
  "https://api.crowdin.com/api/project/${CROWDIN_PROJECT_IDENTIFIER}/download/all.zip?key=${CROWDIN_API_KEY}&branch=${CIRCLE_BRANCH}"

# unzip to locales
unzip -d dist/_locales/ /tmp/crowdin-$$.zip

# delete redundant temp file
rm /tmp/crowdin-$$.zip