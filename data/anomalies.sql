USE TTRPG_DB;

DROP TABLE IF EXISTS anomalies;

CREATE TABLE IF NOT EXISTS anomalies (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    strength ENUM('weak',
                  'normal',
                  'strong',
                  'charged'),
    d4 INT DEFAULT 0,
    d6 INT DEFAULT 0,
    d8 INT DEFAULT 0,
    d10 INT DEFAULT 0,
    d12 INT DEFAULT 0,
    d20 INT DEFAULT 0,
    type ENUM('gravity',
              'electric',
              'thermal',
              'toxic',
              'special'),
    visibility ENUM('almost invisible',
        'invisible',
        'visible'),
    behavior TEXT
    );


LOAD DATA INFILE '/var/lib/mysql-files/anomalies/gravity.csv'
    INTO TABLE anomalies
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    ESCAPED BY '\\'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS;

LOAD DATA INFILE '/var/lib/mysql-files/anomalies/electric.csv'
    INTO TABLE anomalies
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    ESCAPED BY '\\'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS;

LOAD DATA INFILE '/var/lib/mysql-files/anomalies/thermal.csv'
    INTO TABLE anomalies
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    ESCAPED BY '\\'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS;

LOAD DATA INFILE '/var/lib/mysql-files/anomalies/toxic.csv'
    INTO TABLE anomalies
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    ESCAPED BY '\\'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS;

LOAD DATA INFILE '/var/lib/mysql-files/anomalies/special.csv'
    INTO TABLE anomalies
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    ESCAPED BY '\\'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS;

