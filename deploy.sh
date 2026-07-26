#!/usr/bin/env bash
# Build, test, and deploy to https://bubble.arkiv-globe.net (run on the server).
set -euo pipefail
cd "$(dirname "$0")"
node test/model.test.mjs
python3 build.py
sudo cp dist/index.html /var/www/bubble.arkiv-globe.net/index.html
sudo chown www-data:www-data /var/www/bubble.arkiv-globe.net/index.html
echo "deployed: https://bubble.arkiv-globe.net"
