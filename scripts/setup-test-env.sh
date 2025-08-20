#!/usr/bin/env bash
set -euo pipefail

if ! command -v nginx >/dev/null 2>&1; then
  echo "Installing nginx..."
  apt-get update && apt-get install -y nginx
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Installing nodejs and npm..."
  apt-get update && apt-get install -y nodejs npm
fi

npm install
npx playwright install chromium
