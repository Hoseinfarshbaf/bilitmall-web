SELECT 'CREATE DATABASE "bilitmall-web"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bilitmall-web')\gexec
