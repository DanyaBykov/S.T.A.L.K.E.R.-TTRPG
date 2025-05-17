USE TTRPG_DB;

DROP TABLE IF EXISTS medicine;

CREATE TABLE IF NOT EXISTS medicine (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    property TEXT,
    weight DECIMAL(4,2),
    avg_price INT
    );


LOAD DATA INFILE '/var/lib/mysql-files/medicine.csv'
    INTO TABLE medicine
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS
