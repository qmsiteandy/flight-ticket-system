CREATE TABLE `flight` (
    `ID` INT PRIMARY KEY NOT NULL,
    `Airport` VARCHAR(32) NOT NULL,
    `Destination` VARCHAR(32) NOT NULL,
    `Date` DateTime NOT NULL,
    `PlaneModel` VARCHAR(32) NOT NULL
);

CREATE TABLE `ticket` (
    `ID` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    `Owner_ID` int DEFAULT NULL, 
    `Flight_ID` int NOT NULL,
    `Seat` VARCHAR(16) NOT NULL,
    `Price` int NOT NULL,

    FOREIGN KEY (Flight_ID) REFERENCES flight(ID)
);

CREATE TABLE `order` (
    `ID` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    `Owner_ID` int, 
    `Ticket_ID` int,

    FOREIGN KEY(Ticket_ID) REFERENCES ticket(ID)
);