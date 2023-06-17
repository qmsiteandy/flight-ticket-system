CREATE TABLE flight (
    `ID` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    `Airport` VARCHAR(32) NOT NULL,
    `Destination` VARCHAR(32) NOT NULL,
    `Date` DateTime NOT NULL,
    `PlaneModel` VARCHAR(32) NOT NULL,
);