#!/usr/bin/env bash
set -e

cd build/

echo "[CHROME] getting access token..."
CHROME_AUTH=$(curl -s \
 --data "client_id=$CHROME_CLIENT_ID" \
 --data "client_secret=$CHROME_CLIENT_SECRET" \
 --data "refresh_token=$CHROME_REFRESH_TOKEN" \
 --data "grant_type=refresh_token" \
 --data "redirect_uri=urn:ietf:wg:oauth:2.0:oob" \
 "https://www.googleapis.com/oauth2/v4/token"
)

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