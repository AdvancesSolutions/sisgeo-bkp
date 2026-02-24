#!/bin/bash

# Seed production database using NestJS seed script

DB_HOST="sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
DB_NAME="sigeo"
DB_USER="postgres"
DB_PORT="5432"
DB_PASSWORD="${1:-postgres}"

export DB_HOST
export DB_NAME
export DB_USER
export DB_PORT
export DB_PASSWORD
export NODE_ENV="production"

echo "========================================="
echo "SISGEO Production Database Seed"
echo "========================================="
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo ""

# Run seed script
cd /app/apps/api
npm run db:seed

echo ""
echo "✅ Seed completed!"
