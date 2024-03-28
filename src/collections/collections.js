import { client } from "../config/db.js";

const db_name = "Digital-Pharmacy";

const genericCollection = client.db(db_name).collection("generics");

export {genericCollection}