import express from "express";
import { handleCreateMedicine } from "../controllers/medicineControllers.js";
const medicineRouter = express.Router();

medicineRouter.post("/create/medicine", handleCreateMedicine);

export { medicineRouter };
