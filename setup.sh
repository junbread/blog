#!/usr/bin/env bash

# commit-msg convention check
cp -rf ./bin/git-hooks/. ./.git/hooks/

# install dependencies
yarn install

# download notion page
./bin/download-about