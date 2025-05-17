USE TTRPG_DB;

DROP TABLE IF EXISTS artifacts;

CREATE TABLE IF NOT EXISTS artifacts (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    property TEXT,
    source ENUM('gravitational anomlaies',
                'thermal anomalies',
                'electric anomalies',
                'toxic anomalies'),
    rarity ENUM('common',
                'uncommon',
                'rare',
                'legendary',
                'archi-artifact'),
    weight DECIMAL(4,2),
    avg_price INT
    );


LOAD DATA INFILE '/var/lib/mysql-files/artifacts.csv'
    INTO TABLE artifacts
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS
