import express from "express";
import {
  handleCreateGeneric,
  handleGetAllGeneric,
} from "../controllers/genericControllers.js";
const genericRouter = express.Router();

genericRouter.post("/create/generic", handleCreateGeneric);
genericRouter.get("/all", handleGetAllGeneric);

export { genericRouter };
