#!/bin/bash
# ---------------------------------------------------------------------------
# 00-create-databases.sh
# Creates the single shared database + its application account.
# Run automatically by the official MySQL image on the first start
# (only when the volume is empty).
#
# The values come from the `.env` file at the repository root.
# ---------------------------------------------------------------------------
set -euo pipefail

DB_NAME="${APP_DB_NAME:-travel_agency}"
DB_USER="${APP_DB_USER:-app_user}"
DB_PASSWORD="${APP_DB_PASSWORD:-app_pwd_2026}"

echo "[init] Database ${DB_NAME} + account ${DB_USER}"

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "[init] The travel_agency database is ready."