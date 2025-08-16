#!/bin/sh

DB_HOST=${DB_HOST:-myappdb}
DB_PORT=${DB_PORT:-3306}

echo "⏳ Waiting for MySQL on $DB_HOST:$DB_PORT …"

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "✅  MySQL is up – starting Node app"
exec "$@"
