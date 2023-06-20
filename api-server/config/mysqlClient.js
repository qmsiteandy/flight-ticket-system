const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "password",
  database: process.env.MYSQL_DATABASE || "flight",
  port: process.env.MYSQL_PORT || 3306,
});

connection.connect((err) => {
  if (err) {
    console.log("Mysql connection failed...");
    console.log(err);
  } else console.log("Mysql connect successfully!");
});

module.exports = connection;
