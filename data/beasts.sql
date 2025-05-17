USE TTRPG_DB;

DROP TABLE IF EXISTS beasts;

CREATE TABLE IF NOT EXISTS beasts (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    size ENUM('small', 'medium', 'large', 'humanoid'),
    description TEXT,
    abilities TEXT,
    HP INT,
    agility INT
    );


LOAD DATA INFILE '/var/lib/mysql-files/beasts.csv'
    INTO TABLE beasts
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS
