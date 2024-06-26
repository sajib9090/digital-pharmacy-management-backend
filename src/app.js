import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import createError from "http-errors";
import { rateLimit } from "express-rate-limit";
import UAParser from "ua-parser-js";
import { genericRouter } from "./routers/genericRouters.js";
import { companyRouter } from "./routers/companyRouters.js";
import { dosageRouter } from "./routers/dosageFormRouters.js";
import { medicineRouter } from "./routers/medicineRouters.js";
import { purchaseRouter } from "./routers/purchaseRouters.js";

const app = express();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res
      .status(429)
      .json({ success: false, message: "Too many requests, try again later." });
  },
});

//middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/generics", genericRouter);
app.use("/api/v1/companies", companyRouter);
app.use("/api/v1/dosage-forms", dosageRouter);
app.use("/api/v1/medicines", medicineRouter);
app.use("/api/v1/purchases", purchaseRouter);

app.get("/", (req, res) => {
  const clientIP = req.ip;
  const userAgent = req.headers["user-agent"];
  const parser = new UAParser();
  const result = parser.setUA(userAgent).getResult();

  // Extract browser and device information
  const browser = result?.browser?.name
    ? result?.browser?.name
    : result?.ua || "Unknown";
  const device = userAgent?.includes("Mobile") ? "Mobile" : "Desktop";
  const os = { name: result?.os?.name, version: result?.os?.version };
  res.status(200).send({
    success: true,
    message: "Server is running",
    browser: browser,
    device: device,
    operatingSystem: os,
    ipAddress: clientIP,
  });
});

//client error handling
app.use((req, res, next) => {
  createError(404, "Route not found!");
  next();
});

//server error handling
app.use((err, req, res, next) => {
  return res.status(err.status || 500).json({
    success: false,
    message: err.message,
  });
});

export default app;
