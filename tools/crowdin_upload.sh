#!/usr/bin/env bash

# use CIRCLE_BRANCH or master if undefined
CROWDIN_BRANCH=${CIRCLE_BRANCH:-master}

curl \
  -F "json=true" \
  -F "branch=${CROWDIN_BRANCH}" \
  -F "files[/messages.json]=@dist/_locales/en_GB/messages.json" \
  -F "titles[/messages.json]=Extension strings" \
  "https://api.crowdin.com/api/project/${CROWDIN_PROJECT_IDENTIFIER}/update-file?key=${CROWDIN_API_KEY}"