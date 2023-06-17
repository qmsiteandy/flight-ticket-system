CREATE TABLE order(
    `ID` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    `Owner_ID` int, 
    `Ticket_ID` int,

    FOREIGN KEY(Ticket_ID) REFERENCES ticket(ID)
);