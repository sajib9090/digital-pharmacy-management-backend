import express from "express";
import {
  handleCreateDosageForm,
  handleDeleteDosageForm,
  handleGetAllDosage,
} from "../controllers/dosageFormsControllers.js";
const dosageRouter = express.Router();

dosageRouter.post("/create/dosage", handleCreateDosageForm);
dosageRouter.get("/get-all", handleGetAllDosage);
dosageRouter.delete("/delete/:id", handleDeleteDosageForm);

export { dosageRouter };
