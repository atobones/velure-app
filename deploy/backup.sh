#!/bin/sh
# Nightly SQLite backup, keeps 14 days
set -e
D=$(date +%Y%m%d)
docker exec velure-app node -e "require(\"better-sqlite3\")(\"/data/velure.db\",{readonly:true}).backup(\"/data/backups/velure-$D.db\").then(()=>console.log(\"ok\"))"
find /opt/velure/data/backups -name "velure-*.db" -mtime +14 -delete
