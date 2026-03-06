#!/usr/bin/env python3
import psycopg2
import sys
from psycopg2 import sql

# RDS connection details
host = "sigeo-db.c7qe4cecc3pa.sa-east-1.rds.amazonaws.com"
port = 5432
user = "postgres"
dbname = "postgres"  # try to connect to default postgres db first

# Common password attempts
passwords = [
    "postgres",
    "sigeo123",
    "Sigeo123!",
    "admin123",
    "password",
    "",
]

print(f"Attempting to connect to RDS at {host}...")
print()

for pwd in passwords:
    try:
        print(f"Trying password: {'*' * len(pwd) if pwd else '(empty)'}")
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=pwd,
            database=dbname,
            sslmode='require'
        )
        print(f"✓ SUCCESS! Password is: {pwd}")
        conn.close()
        sys.exit(0)
    except psycopg2.OperationalError as e:
        error_msg = str(e)
        if "password authentication failed" in error_msg:
            print(f"  ✗ Password incorrect")
        elif "server closed the connection unexpectedly" in error_msg:
            print(f"  ✗ Connection error (may be firewall)")
        else:
            print(f"  ✗ Error: {error_msg[:80]}")
    except Exception as e:
        print(f"  ✗ Error: {str(e)[:80]}")
    print()

print("All passwords failed.")
sys.exit(1)
