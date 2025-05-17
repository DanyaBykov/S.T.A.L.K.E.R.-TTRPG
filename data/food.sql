USE TTRPG_DB;

DROP TABLE IF EXISTS food;

CREATE TABLE IF NOT EXISTS food (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    food_points INT,
    weight DECIMAL(4,2),
    avg_price INT,
    bonus TEXT
    );


LOAD DATA INFILE '/var/lib/mysql-files/food.csv'
    INTO TABLE food
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS


