# node-app/wait-for-mysql.sh
#!/bin/sh
echo "⏳ Waiting for MySQL on $DB_HOST:3306 …"
while ! nc -z "$DB_HOST" 3306; do
  sleep 1
done
echo "✅  MySQL is up – starting Node app"
exec "$@"
