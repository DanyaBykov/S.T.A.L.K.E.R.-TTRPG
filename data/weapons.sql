USE TTRPG_DB;

DROP TABLE IF EXISTS weapons;

CREATE TABLE IF NOT EXISTS weapons (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    d4 INT DEFAULT 0,
    d6 INT DEFAULT 0,
    d8 INT DEFAULT 0,
    d10 INT DEFAULT 0,
    d12 INT DEFAULT 0,
    d20 INT DEFAULT 0,
    rof INT,
    `range` ENUM('close', 'medium', 'long'),
    calibre VARCHAR(50),
    reliability INT,
    weight DECIMAL(4,2),
    capacity INT,
    avg_price INT
);


LOAD DATA INFILE '/var/lib/mysql-files/weapons.csv'
    INTO TABLE weapons
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS
    (id, name, type, d4, d6, d8, d10, d12, d20, rof, `range`, calibre, reliability, weight, capacity, avg_price);


