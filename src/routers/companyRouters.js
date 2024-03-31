import express from "express";
import {
  handleCreateCompany,
  handleDeleteCompany,
  handleGetAllCompany,
  handleGetSingleCompany,
} from "../controllers/companyControllers.js";
const companyRouter = express.Router();

companyRouter.post("/create/company", handleCreateCompany);
companyRouter.get("/get-all", handleGetAllCompany);
companyRouter.get("/get-company", handleGetSingleCompany);
companyRouter.delete("/delete/:id", handleDeleteCompany);

export { companyRouter };
