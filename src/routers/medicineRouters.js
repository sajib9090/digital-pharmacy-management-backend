import express from "express";
import {
  handleCreateMedicine,
  handleDeleteMedicine,
  handleGetMedicines,
  handleGetSingleMedicine,
} from "../controllers/medicineControllers.js";
const medicineRouter = express.Router();

medicineRouter.post("/create/medicine", handleCreateMedicine);
medicineRouter.get("/get-all", handleGetMedicines);
medicineRouter.get("/get-medicine", handleGetSingleMedicine);
medicineRouter.delete("/delete-medicine/:id", handleDeleteMedicine);

export { medicineRouter };
