import express from "express";
import {
  handleCreateGeneric,
  handleDeleteGeneric,
  handleGetAllGeneric,
  handleGetSingleGeneric,
} from "../controllers/genericControllers.js";
const genericRouter = express.Router();

genericRouter.post("/create/generic", handleCreateGeneric);
genericRouter.get("/all", handleGetAllGeneric);
genericRouter.get("/get-generic", handleGetSingleGeneric);
genericRouter.delete("/delete/:id", handleDeleteGeneric);

export { genericRouter };
