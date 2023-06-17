const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
require("dotenv").config();

app.get("/", (req, res) => {
  return res.status(200).send("Home Page");
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is running on port ${process.env.SERVER_PORT}`);
});
