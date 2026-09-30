#!/bin/sh
set -e

# The key lives in the volume so it survives restarts.
if [ -z "$APP_KEY" ]; then
  mkdir -p tmp
  [ -f tmp/.app_key ] || node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64url'))" > tmp/.app_key
  export APP_KEY="$(cat tmp/.app_key)"
fi

node ace migration:run --force
node ace db:seed

exec "$@"
