#!/bin/bash

set -e

echo "[CHROME] bundling..."

mkdir -p "build/chrome"
cp -af "dist/." "build/chrome/"
cd "build/chrome"
echo $(cat "manifest.chrome.json") > "manifest.json"
zip -r9 "../mas-chrome.zip" *
cd ..

echo "[CHROME] getting access token..."
CHROME_AUTH=$(curl "https://www.googleapis.com/oauth2/v4/token" -d \
"client_id=$CHROME_CLIENT_ID&client_secret=$CHROME_CLIENT_SECRET&refresh_token=$CHROME_REFRESH_TOKEN&grant_type=refresh_token&redirect_uri=urn:ietf:wg:oauth:2.0:oob")

CHROME_ACCESS_TOKEN=$(echo ${CHROME_AUTH} | jq -r ".access_token")

echo "[CHROME] uploading..."
curl \
-H "Authorization: Bearer $CHROME_ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-X PUT \
-T mas-chrome.zip \
-v \
https://www.googleapis.com/upload/chromewebstore/v1.1/items/$CHROME_APP_ID

echo "[CHROME] publishing..."
curl \
-H "Authorization: Bearer $CHROME_ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-H "Content-Length: 0" \
-X POST \
-v \
https://www.googleapis.com/chromewebstore/v1.1/items/$CHROME_APP_ID/publish