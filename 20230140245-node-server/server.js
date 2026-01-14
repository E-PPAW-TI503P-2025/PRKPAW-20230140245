require("dotenv").config();
console.log("Nilai JWT_SECRET di server.js:", process.env.JWT_SECRET);
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3001;
const morgan = require("morgan");
const path = require("path");

const db = require("./models");
db.sequelize.sync({ force: false }).then(() => {
  console.log("Database synced successfully.");
}).catch((err) => {
  console.error("Error syncing database:", err);
});

const iotRoutes = require("./route/iot");

app.use("/upload", express.static(path.join(__dirname, "upload")));
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.use("/api/iot", iotRoutes);
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});
