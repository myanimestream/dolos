#!/usr/bin/env bash
set -e

cd build/

echo "[CHROME] getting access token..."
CHROME_AUTH=$(curl --silent \
 --data "client_id=$CHROME_CLIENT_ID" \
 --data "client_secret=$CHROME_CLIENT_SECRET" \
 --data "refresh_token=$CHROME_REFRESH_TOKEN" \
 --data "grant_type=refresh_token" \
 --data "redirect_uri=urn:ietf:wg:oauth:2.0:oob" \
 "https://www.googleapis.com/oauth2/v4/token"
)

CHROME_ACCESS_TOKEN=$(echo ${CHROME_AUTH} | jq -r ".access_token")

echo "[CHROME] uploading..."
curl --silent \
--request PUT \
--header "Authorization: Bearer $CHROME_ACCESS_TOKEN"  \
--header "x-goog-api-version: 2" \
--upload-file mas-chrome.zip \
"https://www.googleapis.com/upload/chromewebstore/v1.1/items/$CHROME_APP_ID"

echo "[CHROME] publishing..."
curl --silent \
--request POST \
--header "Authorization: Bearer $CHROME_ACCESS_TOKEN"  \
--header "x-goog-api-version: 2" \
--header "Content-Length: 0" \
"https://www.googleapis.com/chromewebstore/v1.1/items/$CHROME_APP_ID/publish"

cd ../signed/

echo "[CHROME] downloading signed..."
wget --quiet \
--output-document=mas-chrome.crx \
"https://clients2.google.com/service/update2/crx?response=redirect&prodversion=$CHROME_PRODVERSION&acceptformat=crx2,crx3&x=id%3D$CHROME_EXTENSION_ID%26uc"

echo "[CHROME] done"