const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
require("dotenv").config();
const mysql = require("./config/mysqlConnection");

app.get("/", (req, res, next) => {
  return res.status(200).send("Hello World");
});

app.get("/api/flight", (req, res, next) => {
  mysql.query("SELECT * FROM flight", (err, result) => {
    if (err) next(err);
    res.status(200).send(result);
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send({ error: "Something is wrong. Error: " + err });
});

const port = process.env.API_SERVER_PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
