const express = require("express");
const router = express.Router();
const mysql = require("../config/mysqlClient");

// Recreate Demo data of Table flight and ticket
router.post("/demoSeed", async (req, res, next) => {
  // NOTICE:
  // Must delete ticket data before flight data, beecuse of the Foieign Key Constrains

  // Delete old demo data rows of ticket
  await mysql.query("DELETE FROM ticket WHERE Flight_ID = 0", (err, result) => {
    if (err) next(err);
  });

  // Delete old demo data row of flight
  await mysql.query("DELETE FROM flight WHERE id= 0", (err, result) => {
    if (err) next(err);
  });

  // Create new demo data row of flight
  await mysql.query(
    "INSERT INTO flight (ID, Airport, Destination, Date, PlaneModel) \
    VALUE(0, 'TPE', 'TKY', '2023-06-28', 'A321neo')",
    (err, result) => {
      if (err) next(err);
    }
  );

  // Create new demo data rows of ticket
  await mysql.query(
    "INSERT INTO ticket (Flight_ID, Seat, Price) \
    VALUE ?",
    [ticket_demo_values],
    (err, result) => {
      if (err) next(err);
    }
  );

  res.status(200).send("Recreate Demo Data Success");
});

// Each row means Flight_ID, Seat, Price
const ticket_demo_values = [];
for (let i = 1; i <= 10; i++) {
  ticket_demo_values.push([0, `${i}A`, 1000]);
  ticket_demo_values.push([0, `${i}B`, 1000]);
  ticket_demo_values.push([0, `${i}C`, 1000]);
  ticket_demo_values.push([0, `${i}D`, 1000]);
  ticket_demo_values.push([0, `${i}E`, 1000]);
  ticket_demo_values.push([0, `${i}F`, 1000]);
}

module.exports = router;
