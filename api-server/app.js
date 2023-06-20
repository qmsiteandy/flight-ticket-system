const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
require("dotenv").config();
const mysql = require("./config/mysqlClient");
const redis = require("./config/redisClient");

// Middleware for cookie and body
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Route for API
app.get("/", (req, res, next) => {
  return res.status(200).send("Hello World");
});

// Routes Middleware
app.use("/api/admin", routes.adminRouter);

// API for testing mysql connection
app.get("/api/mysqlTest", (req, res, next) => {
  mysql.query("SELECT * FROM flight", (err, result) => {
    if (err) next(err);
    res.status(200).send(result);
  });
});

// API for testing redis connection
app.get("/api/redisTest", async (req, res, next) => {
  try {
    await redis.SET("test", "value123");
    let data = await redis.GET("test");
    res.send(data);
  } catch (e) {
    next(e);
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send({ error: "Something is wrong. Error: " + err });
});

// Running the server
const port = process.env.API_SERVER_PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
