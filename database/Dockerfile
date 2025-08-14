FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD="admin123"
ENV MYSQL_DATABASE="myappdb"

EXPOSE 3306

ADD init-db.sql docker-entrypoint-initdb.d/init-db.sql
