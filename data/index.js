const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const app = express();

const ALIGHTMOTION_API_BASE = "https://sylvatica.my.id/api/tools/alightmotion";
const ALIGHTMOTION_APIKEY = process.env.ALIGHTMOTION_APIKEY || "";
const ALIGHTMOTION_TIMEOUT = Number(process.env.ALIGHTMOTION_TIMEOUT_MS || 20000);

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-admin-key"]
}));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Vercel functions do not have persistent local storage.
// Orders are kept in memory for this lightweight deployment.
const orders = new Map();

function makeOrder(email, pkg) {
  const id = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const now = new Date().toISOString();
  const order = {
    id,
    email,
    package: pkg,
    status: "pending",
    createdAt: now,
    updatedAt: now
  };
  orders.set(id, order);
  return order;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function callAlightMotion(email, options, url) {
  if (!ALIGHTMOTION_APIKEY) {
    throw new Error("ALIGHTMOTION_APIKEY belum dikonfigurasi di Vercel.");
  }

  const response = await axios.get(ALIGHTMOTION_API_BASE, {
    params: {
      email,
      options: options || "",
      url: url || "",
      apikey: ALIGHTMOTION_APIKEY
    },
    timeout: ALIGHTMOTION_TIMEOUT,
    validateStatus: () => true
  });

  return response;
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    apiConfigured: Boolean(ALIGHTMOTION_APIKEY)
  });
});

app.post("/api/alightmotion", async (req, res) => {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase() : "";
  const options = typeof req.body?.options === "string"
    ? req.body.options.trim() : "";
  const url = typeof req.body?.url === "string"
    ? req.body.url.trim() : "";

  if (!validEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Email tidak valid."
    });
  }

  try {
    const response = await callAlightMotion(email, options, url);
    return res.status(response.status).json({
      success: response.status >= 200 && response.status < 300,
      data: response.data
    });
  } catch (err) {
    console.error("Alight Motion API error:", err.message);
    return res.status(502).json({
      success: false,
      message: err.message.includes("belum dikonfigurasi")
        ? err.message
        : "Gagal terhubung ke API."
    });
  }
});

app.post("/api/order", async (req, res) => {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase() : "";
  const pkg = typeof req.body?.package === "string"
    ? req.body.package.trim() : "";
  const options = typeof req.body?.options === "string"
    ? req.body.options.trim() : "";
  const url = typeof req.body?.url === "string"
    ? req.body.url.trim() : "";

  const allowedPackages = new Set(["7-days", "30-days", "90-days"]);

  if (!validEmail(email)) {
    return res.status(400).json({ success: false, message: "Format email tidak valid." });
  }
  if (!allowedPackages.has(pkg)) {
    return res.status(400).json({ success: false, message: "Paket tidak valid." });
  }

  const order = makeOrder(email, pkg);

  try {
    const response = await callAlightMotion(
      email,
      options || pkg,
      url
    );

    if (response.status < 200 || response.status >= 300) {
      order.status = "rejected";
      order.updatedAt = new Date().toISOString();
      return res.status(502).json({
        success: false,
        message: "API layanan mengembalikan error.",
        data: {
          orderId: order.id,
          package: order.package,
          status: order.status
        }
      });
    }

    order.status = "processing";
    order.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      message: "Order berhasil dikirim ke layanan API.",
      data: {
        orderId: order.id,
        package: order.package,
        status: order.status,
        api: response.data
      }
    });
  } catch (err) {
    console.error("Order API error:", err.message);
    return res.status(502).json({
      success: false,
      message: "Gagal terhubung ke API layanan.",
      data: {
        orderId: order.id,
        package: order.package,
        status: order.status
      }
    });
  }
});

app.get("/api/order/status", (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();

  if (!validEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Email tidak valid."
    });
  }

  const result = [...orders.values()]
    .filter(o => o.email === email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(o => ({
      orderId: o.id,
      package: o.package,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt
    }));

  res.json({ success: true, data: result });
});

app.patch("/api/order/:id/status", (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Tidak diizinkan."
    });
  }

  const allowed = new Set(["pending", "processing", "completed", "rejected"]);
  const status = req.body?.status;

  if (!allowed.has(status)) {
    return res.status(400).json({
      success: false,
      message: "Status tidak valid."
    });
  }

  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order tidak ditemukan."
    });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  res.json({ success: true, data: order });
});

module.exports = app;
