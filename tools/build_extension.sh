#!/usr/bin/env bash
set -e

REPO_DIR=${PWD}


WORK_DIR=$(mktemp -d)

function cleanup {
  rm -rf "$WORK_DIR"
  echo "Deleted temp working directory $WORK_DIR"
}

trap cleanup EXIT

mkdir -p build/

for NAME in "chrome" "firefox"
do
    cd ${REPO_DIR}
    echo "[$NAME] bundling..."

    mkdir -p ${WORK_DIR}/${NAME}/
    cd ${WORK_DIR}/${NAME}/
    cp -af ${REPO_DIR}/dist/. .

    echo $(cat "manifest.$NAME.json") > "manifest.json"
    find . -name "manifest.*.json" -delete

    zip -r9 "$REPO_DIR/build/mas-$NAME.zip" *
done