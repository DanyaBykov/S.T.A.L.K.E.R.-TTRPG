USE TTRPG_DB;

DROP TABLE IF EXISTS ammo;

CREATE TABLE IF NOT EXISTS ammo (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('normal', 'HP', 'AP'),
    special TEXT,
    weight DECIMAL(4,2),
    avg_price INT
    );


LOAD DATA INFILE '/var/lib/mysql-files/ammo.csv'
    INTO TABLE ammo
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS
