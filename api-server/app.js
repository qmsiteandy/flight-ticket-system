const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
require("dotenv").config();

app.get("/", (req, res) => {
  return res.status(200).send("Home Page");
});

const port = process.env.API_SERVER_PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
