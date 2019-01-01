#!/bin/bash

set -e

mkdir -p "build/firefox"
cp -af "dist/." "build/firefox/"
cd "build/firefox"
echo $(cat "manifest.webextension.json") > "manifest.json"

npm i web-ext
web-ext sign --api-key "${FIREFOX_API_KEY}" --api-secret "${FIREFOX_API_SECRET}" --artifacts-dir "artifact"

file="$(ls  *.xpi | tail -n1)"
cp -v "$file" "../mas-firefox.xpi"