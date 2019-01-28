#!/bin/bash

set -e

echo "[CHROME] bundling..."

mkdir -p "temp/chrome"
cp -af "dist/." "temp/chrome/"
cd "temp/chrome"
echo $(cat "manifest.chrome.json") > "manifest.json"
zip -r9 "../../build/mas-chrome.zip" *
cd ../../build/

echo "[CHROME] getting access token..."
CHROME_AUTH=$(curl -s "https://www.googleapis.com/oauth2/v4/token" -d \
"client_id=$CHROME_CLIENT_ID&client_secret=$CHROME_CLIENT_SECRET&refresh_token=$CHROME_REFRESH_TOKEN&grant_type=refresh_token&redirect_uri=urn:ietf:wg:oauth:2.0:oob")

CHROME_ACCESS_TOKEN=$(echo ${CHROME_AUTH} | jq -r ".access_token")

echo "[CHROME] uploading..."
curl -s \
-H "Authorization: Bearer $CHROME_ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-X PUT \
-T mas-chrome.zip \
https://www.googleapis.com/upload/chromewebstore/v1.1/items/$CHROME_APP_ID

echo "[CHROME] publishing..."
curl -s \
-H "Authorization: Bearer $CHROME_ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-H "Content-Length: 0" \
-X POST \
https://www.googleapis.com/chromewebstore/v1.1/items/$CHROME_APP_ID/publish