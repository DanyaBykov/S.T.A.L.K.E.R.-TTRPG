CREATE USER IF NOT EXISTS 'ttrpg_user'@'%' IDENTIFIED WITH mysql_native_password BY 'secretpass';
GRANT ALL PRIVILEGES ON TTRPG_DB.* TO 'ttrpg_user'@'%';
FLUSH PRIVILEGES;