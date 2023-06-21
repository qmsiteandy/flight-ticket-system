const express = require("express");
const router = express.Router();
const fs = require("fs");
const mysql = require("../config/mysqlClient");
const redis = require("../config/redisClient");

// 取得班機資料
router.get("/flight", (req, res, next) => {
  mysql.query("SELECT * FROM flight", (err, result) => {
    if (err) next(err);
    return res.status(200).send(result);
  });
});

// 顯示我的訂單
router.get("/order/:user_id", (req, res, next) => {
  const { user_id } = req.params;
  mysql.query(
    "SELECT * FROM ticket_order WHERE Owner_ID=?",
    [user_id],
    (err, result) => {
      if (err) next(err);
      return res.status(200).send(result);
    }
  );
});

// 訂購機票
router.post("/bookTicket/:flight_id", async (req, res, next) => {
  const user_id = parseInt(req.body.user_id);
  const flight_id = parseInt(req.params.flight_id);
  const qty = req.query.qty || 1;

  if (qty === 0) return res.status(400).send("qty could not be less than 0");
  if (!user_id) return res.status(400).send("user_id in body is missing");

  // Load Lua script
  const bookTicketScript = fs.readFileSync("./lua/bookTicket.lua");

  // Run Lua script
  //    @key item_key (format: "flight#{flight_id}")
  //    @args qty, user_id
  //    @return format [seat1, ticket_id1, [seat2, ticket_id2,]...] ex: ["1E","31","1F","32"]
  let bookedData;
  try {
    bookedData = await redis.eval(bookTicketScript, {
      keys: [`flightTicket#${flight_id}`],
      arguments: [qty.toString()],
    });
  } catch (e) {
    next(e);
  }

  // Retrieve no Ticket from Redis
  if (bookedData == null)
    return res.status(400).send("Booking fail. No available ticket.");

  // Deserialize data
  // Return will ba like [{"ticket_id": 41 ,"seat": "3C"}, {"ticket_id": 42,"seat": "3D"}]
  bookedData = bookedDataDeserialize(bookedData);

  // Update Ticket data in MySQL
  // 1. Update Owner_ID of Ticket row
  // 2. Create new ticket_order row
  Promise.all([
    bookedData.forEach((item) => {
      mysql.query("UPDATE ticket SET Owner_ID=? WHERE ID=?", [
        user_id,
        item.ticket_id,
      ]),
        (err) => {
          if (err) next(err);
        };
      mysql.query("INSERT ticket_order (Owner_ID, Ticket_ID) VALUE(?,?)", [
        user_id,
        item.ticket_id,
      ]),
        (err) => {
          if (err) next(err);
        };
    }),
  ]);

  res.status(200).send(bookedData);
});

// Original data from redis: [ '2E', '37', '2F', '38' ]
// Deserialize to be [{"ticket_id": 41 ,"seat": "3C"}, {"ticket_id": 42,"seat": "3D"}]
// And also convert ticket_id to int
function bookedDataDeserialize(bookedData) {
  result = [];
  while (bookedData.length > 0) {
    let [seat, ticket_id, ...rest] = bookedData;
    bookedData = rest;
    result.push({ ticket_id: parseInt(ticket_id), seat: seat });
  }
  return result;
}

module.exports = router;
