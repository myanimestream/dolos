#!/usr/bin/env bash
set -e

REP_DIR=${PWD}
cd build/

WORK_DIR=$(mktemp -d)

function cleanup {
  rm -rf "$WORK_DIR"
  echo "Deleted temp working directory $WORK_DIR"
}

trap cleanup EXIT

unzip mas-firefox.zip -d ${WORK_DIR}
cd ${WORK_DIR}

echo "[FIREFOX] signing..."
npx web-ext sign --api-key "${FIREFOX_API_KEY}" --api-secret "${FIREFOX_API_SECRET}" --artifacts-dir "artifact"

file=$(ls  artifact/*.xpi | tail -n1)
cp -v "$file" "$REP_DIR/signed/mas-firefox.xpi"