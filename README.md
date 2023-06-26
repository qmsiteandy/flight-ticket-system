# 系統介紹

### 【專案說明】

> 以此專案練習最近學到的技術，製作一個航空公司訂票系統後端，並設計情境 **「搶購限量優惠機票名額，處裡大量併發請求」** 的功能，並部屬至 GCE 雲服務。
>
> 核心技術點：
>
> - Docker-Compose 建置 Redis、MySQL、API Server 系統
> - GCE 部屬雲端伺服器服務
> - Redis + Lua 高併發處理
> - MySQL 記錄搶到的票資訊
> - Google DNS 設定
> - JMeter 進行負載測試

### 【系統架構安排】

![系統架構圖](https://i.imgur.com/kVW4atL.png)

1. Client 請求經 Google DNS 轉換，將 Domain 轉換為系統的 IP。
2. 系統運行於 GCP 的 Compute Engine 中，目前對外 IP 為 34.80.90.193 ，並且 Firewall 允許 http port 80 連線。
3. GCE 的 instance VM 中使用 Docker-Compose 啟動三項容器：
   - Express Server (port 80)
   - MySQL Server (port 3306)
   - Redis Server (port 6379)
4. Express 與 MySQL & Redis 連線並操作。

### 【資料庫安排】

![MySQL 資料庫安排](https://i.imgur.com/Rc5h9NT.png)

資料庫選擇使用 RDBMS，我選擇先使用熟悉的工具 MySQL，並建立三個資料表 (關聯如上圖)：

- flight：紀錄航班資訊
- ticket：紀錄機票資訊，並記錄關聯持有者及航班，如果這張機票還沒有人搶到，持有者為 Null。
- ticket_order：紀錄已成功搶到的機票訂單，並記錄關聯持有者及機票。
- 目前尚未創建 User Table ，ticket、order 中的 Owner_ID 會先設定記錄 Demo 測試時輸入的使用者 ID。

![Redis 資料庫安排](https://i.imgur.com/bjPj5kt.png)

使用 Redis 快取機票資訊，搭配 Lua 腳本執行，可以有效處理高併發及避免超賣狀況。

- filghtTicket# {flight_id}：使用 Sorted Set 紀錄一個航班的座位資料，每一個 Row 會記錄機票的 Seat 及 Ticked_ID。
- ticketSellCount# {flight_id}：記錄一個航班的機票出售數量，主要用於確認有無超賣。

### 【運作流程】

![運作流程圖](https://i.imgur.com/eoKVGCb.png)

**Admin 操作**

1. 建立航班及機票資料。
2. 設定快取某一個航班的機票資料，會由 MySQL 撈出該航班所有未售出的機票資料 (Seat & Ticket_ID) 並存至 Redis 的 Sorted Set。

**Client 操作 & Server 運作**

1. 呼叫訂票 API 並帶入自己的 User_ID 以及訂票數量。
2. Server 呼叫 Redis 執行 Lua 指令：
   - Lua 到對應的 Redis Sorted Set 確認剩餘數量是否大於訂購數量 ( Key：`filghtTicket# {flight_id}` )
   - 如果機票不足，回傳 null 至 Server
   - 如果機票足夠，ZPOPMIN 指令取出前 N 項機票資料 (這個指令同時會刪除取出的項目)
   - Redis 紀錄出售張數 +1 ( Key：`ticketSellCount# {flight_id}` )
3. 如果有成功搶到機票，Server 呼叫 MySQL 設定資料：
   - 設定 ticket.Owner_ID 為這個使用者
   - 新增一筆 ticket_order 資料，紀錄機票 ID 及持有人 ID

### 【程式架構】

```
- api-server
    ├── app.js
    ├── routes
    |     ├── index.js
    |     ├── adminRouter.js
    |     └── clientRouter.js
    ├── config
    |     ├── redisClient.js
    |     └── mysqlClient.js
    ├── lua
    |     └── bookTicket.lua
    ├── Dockerfile
    └── package.json
- mysql
    └── init
	  └── init.sql
- docker-compose.yml
- .env
```

### 【使用工具】

| 項目          | 語言及工具                                  |
| ------------- | ------------------------------------------- |
| Framework     | Node.js + Express                           |
| Database      | MySQL、Redis (& Lua)                        |
| DataBase GUI  | MySQL Workbench、RedisInsight               |
| Cloud Server  | Docker-Compose、GCE (Google Compute Engine) |
| Domain & DNS  | GoDaddy、Google DNS                         |
| API Tester    | Postman                                     |
| Stress Tester | Jmeter                                      |

# Demo 操作 & JMeter 壓力測試

https://youtu.be/kU-pjC2lXrg

# 系統小細節介紹

## Docker-Compose 服務啟動時自動初始化 MySQL Table

為了讓 MySQL 可以自動初始化建立資料表，使用到 Docker-Compose 的 Volume 以及 `/docker-entrypoint-initdb.d` 資料夾，將需要初始化的 .sql 檔案放如這個資料夾中，啟動服務時便會自動運行。

```yaml
# docker-compose.yml
...
mysql:
...
    volumes:
	    # 將 init 目錄與 docker-entrypoint-initdb.d 目錄 Volume 連結
        - ./mysql/init:/docker-entrypoint-initdb.d**
...
```

## Docker-Compose 設定 api-server 等待 MySQL Health 狀態

MySQL 自動初始化的缺點是，初始化工作會在容器建立完成後才執行，也就是 MySQL Container 已經 Run 成功，但其實內部還在初始化運作中，還無法連線。這個情況下單靠 docker-compose 的 `depends_on` 指令無法派上用場。

參考網路上的做法，改在 MySQL Server 進行 Health Check，進行每 10 秒 ping 一次自己的 [localhost](http://localhost) 確認是否可以連線。並在 docker-compose 中 api-server 的 `depends_on` 加上 mysql 的 health condition。

```yaml
# docker-compose.yml
...
mysql:
    ...
    healthcheck:
        test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
        timeout: 10s
        retries: 30

api-server:
    ...
    depends_on:
        mysql:
        condition: service_healthy
	...
```

## api-server 本地端開發與 Docker-Compose 啟動使用不同 port

平常做開發時，我習慣先使用 docker-compose up 將服務都建立起來，因為開發時也需要用到 Mysql、Redis，然而如果 api-server 每次修改後都要重新 compose up 重新 build 太花時間了。

所以我將 .env 放在資料夾最外層，平常開發 api-server 時會直接 cd 進到 api-server 的資料夾並啟動 nodemon run dev。因為這時候讀取不到 .env 檔，所以 express 會運行在 8000 port 上；而如果是用 docker-compose up 啟動的 api-server 則會使用 .env 設定的 80 port 運行。

```
程式碼架構
- api-server
    ├── app.js
		...
- docker-compose.yml
- .env
```

```jsx
// api-server > app.js
...
const port = process.env.API_SERVER_PORT || 8000; // run on 8000 while no .env
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

# 未來開發

1. 使用 Nginx 進行負載均衡
2. 如果還有時間可以再做個簡易前端介面
3. 進一步可以嘗試 Git CICD
4. 設計機制在檔期前自動將機票資訊存入 Redis 中
5. 建立資料時可以設定不同機型、不同的座位數量等
6. 設計搶票的座位安排 (例如同一個使用者搶 4 張票，安排相鄰座位)
