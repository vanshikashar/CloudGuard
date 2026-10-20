@'
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = Number(process.env.PORT || 5000);

const DRY_RUN = process.env.DRY_RUN !== "false";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "cloudguard-backend",
    environment: process.env.NODE_ENV || "development",
    dryRun: DRY_RUN,
    awsActionsEnabled: false,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/safety", (req, res) => {
  res.json({
    dryRun: DRY_RUN,
    automaticResourceChangesEnabled: false,
    productionActionsAllowed: false,
    storageDeletionAllowed: false,
    message: "CloudGuard is running in safe local mode."
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found"
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`CloudGuard backend running at http://127.0.0.1:${PORT}`);
  console.log(`Dry-run mode: ${DRY_RUN}`);
  console.log("AWS resource modifications are not implemented.");
});
'@ | Set-Content -Encoding utf8 server.js