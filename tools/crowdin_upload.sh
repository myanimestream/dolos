#!/usr/bin/env bash

curl \
  -F "json=true" \
  -F "branch=${CIRCLE_BRANCH}" \
  -F "files[messages.json]=@dist/_locales/en_GB/messages.json" \
  -F "titles[messages.json]=Extension messages" \
  "https://api.crowdin.com/api/project/${CROWDIN_PROJECT_IDENTIFIER}/update-file?key=${CROWDIN_API_KEY}"