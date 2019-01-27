#!/usr/bin/env bash
set -e

rev=$(git rev-parse --short HEAD)

git config credential.helper "cache --timeout=120"
git config user.email "$GH_EMAIL"
git config user.name "$GH_USERNAME"

git remote add upstream "https://$GITHUB_TOKEN@github.com/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME.git"
git fetch upstream
git reset upstream/gh-pages

git add --force docs
git commit --message "chore: deploy ${rev}"
git push --quiet upstream HEAD:gh-pages > /dev/null 2>&1