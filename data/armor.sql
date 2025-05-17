USE TTRPG_DB;

DROP TABLE IF EXISTS armor;

CREATE TABLE IF NOT EXISTS armor (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    physical INT,
    radioactive INT,
    chemical INT,
    thermal INT,
    electric INT,
    psy INT,
    artefact_slots INT,
    quick_slots INT,
    reliability INT,
    weight DECIMAL(4,2),
    special TEXT,
    avg_price INT
    );


LOAD DATA INFILE '/var/lib/mysql-files/armor.csv'
    INTO TABLE armor
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS
