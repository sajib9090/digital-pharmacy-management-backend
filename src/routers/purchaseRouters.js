import express from "express";
import { handleCreatePurchase } from "../controllers/purchaseController.js";

const purchaseRouter = express.Router();

purchaseRouter.post("/create/purchase", handleCreatePurchase);
// medicineRouter.get("/get-all", handleGetMedicines);
// medicineRouter.get("/get-medicine", handleGetSingleMedicine);
// medicineRouter.delete("/delete-medicine/:id", handleDeleteMedicine);

export { purchaseRouter };
