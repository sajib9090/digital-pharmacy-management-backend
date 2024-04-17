import express from "express";
import {
  handleCreatePurchase,
  handleGetPurchaseInvoice,
} from "../controllers/purchaseController.js";

const purchaseRouter = express.Router();

purchaseRouter.post("/create/purchase", handleCreatePurchase);
purchaseRouter.get("/get-all", handleGetPurchaseInvoice);
// medicineRouter.get("/get-medicine", handleGetSingleMedicine);
// medicineRouter.delete("/delete-medicine/:id", handleDeleteMedicine);

export { purchaseRouter };
