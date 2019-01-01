#!/bin/bash

set -e

mkdir -p "build/chrome"
cp -af "dist/." "build/chrome/"
cd "build/chrome"
echo $(cat "manifest.chrome.json") > "manifest.json"
zip -r9 "../mas-chrome.zip" *

cd ..

curl \
-H "Authorization: Bearer $CHROME_TOKEN"  \
-H "x-goog-api-version: 2" \
-X PUT \
-T mas-chrome.zip \
-v \
https://www.googleapis.com/upload/chromewebstore/v1.1/items/$CHROME_APP_ID