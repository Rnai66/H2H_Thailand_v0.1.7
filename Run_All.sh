#!/usr/bin/env zsh
set -e
npm i --prefix backend
npm run --prefix backend test:db
npm run dev:all
