
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { getAwsCosts } = require("./awsCostService");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = "127.0.0.1";
const isProduction = process.env.NODE_ENV === "production";

// --------------------------------------------------
// Core middleware
// --------------------------------------------------

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "100kb" }));

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "cloudguard-backend",
    environment: process.env.NODE_ENV || "development",
    dryRun: true,
    awsActionsEnabled: false,
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// Safety status
// --------------------------------------------------

app.get("/api/safety", (req, res) => {
  res.status(200).json({
    dryRun: true,
    automaticResourceChangesEnabled: false,
    productionActionsAllowed: false,
    storageDeletionAllowed: false,
    billingAccess: "read-only",
    message:
      "CloudGuard is running in safe mode. AWS resource changes and storage deletion are disabled.",
  });
});

// --------------------------------------------------
// Demo metrics
// Real AWS billing is available through /api/aws/costs.
// --------------------------------------------------

app.get("/api/metrics", (req, res) => {
  res.status(200).json({
    source: "demo",
    currency: "USD",
    estimatedMonthlyCost: 0,
    monthlyBudget: 100,
    budgetUsedPercent: 0,
    potentialSavings: 0,
    resourcesMonitored: 0,
    activeAlerts: 0,
    note: "Demo values only; AWS billing data is not connected to this endpoint.",
  });
});

// --------------------------------------------------
// Demo alerts
// --------------------------------------------------

app.get("/api/alerts", (req, res) => {
  res.status(200).json({
    source: "demo",
    count: 0,
    alerts: [],
  });
});

// --------------------------------------------------
// Demo activity logs
// --------------------------------------------------

app.get("/api/logs", (req, res) => {
  res.status(200).json({
    source: "demo",
    count: 0,
    logs: [],
  });
});

// --------------------------------------------------
// AWS Cost Explorer - read-only billing endpoint
// --------------------------------------------------

app.get("/api/aws/costs", async (req, res) => {
  try {
    const data = await getAwsCosts();

    return res.status(200).json(data);
  } catch (error) {
    console.error("AWS Cost Explorer request failed:", {
      name: error.name,
      message: error.message,
    });

    const accessDenied =
      error.name === "AccessDeniedException" ||
      error.name === "UnauthorizedOperation";

    return res.status(accessDenied ? 403 : 502).json({
      source: "aws-cost-explorer",
      error: "Unable to retrieve AWS costs.",
      ...(isProduction
        ? {}
        : {
            details: error.message,
            errorName: error.name,
          }),
    });
  }
});

// --------------------------------------------------
// Unknown route handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// --------------------------------------------------
// Malformed JSON and request error handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON request body",
    });
  }

  if (err.status === 413) {
    return res.status(413).json({
      error: "Request body is too large",
    });
  }

  console.error("Unhandled backend error:", err.message);

  return res.status(500).json({
    error: "Internal server error",
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, HOST, () => {
  console.log(`CloudGuard backend running at http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("Dry-run mode: enabled");
  console.log("Automatic AWS resource changes: disabled");
  console.log("AWS billing endpoint: /api/aws/costs");
});
