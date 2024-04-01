import { client } from "../config/db.js";

const db_name = "Digital-Pharmacy";

const genericCollection = client.db(db_name).collection("generics");
const medicineCollection = client.db(db_name).collection("medicines");
const companyCollection = client.db(db_name).collection("companies");
const dosageCollection = client.db(db_name).collection("dosage-forms");

export {
  genericCollection,
  medicineCollection,
  companyCollection,
  dosageCollection,
};
