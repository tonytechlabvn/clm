#!/bin/sh
set -e

echo "Running Prisma migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "Seeding database (idempotent)..."
node ./node_modules/prisma/build/index.js db seed || echo "Seed skipped (may need ts-node)"

echo "Starting CLM server..."
exec node server.js
