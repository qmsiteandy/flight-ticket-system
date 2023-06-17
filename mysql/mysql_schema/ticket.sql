CREATE TABLE ticket(
    `ID` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    `Owner_ID` int, 
    `Flight_ID` int NOT NULL,
    `Seat` VARCHAR(16) NOT NULL,
    `Price` int NOT NULL,

    FOREIGN KEY (Flight_ID) REFERENCES flight(ID)
);