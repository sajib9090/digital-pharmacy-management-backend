import createError from "http-errors";
import { ObjectId } from "mongodb";
import { medicineCollection } from "../collections/collections.js";
import { dosageCollection } from "../collections/collections.js";
import { validateString } from "../helper/validateString.js";
import slugify from "slugify";
import validator from "validator";

const handleCreateMedicine = async (req, res, next) => {
  const {
    shop_name,
    medicine_name,
    generic_name,
    company_name,
    strength,
    dosage_form,
    purchase_price,
    sell_price,
  } = req.body;
  try {
    if (!shop_name) {
      throw createError(400, "Shop name is required");
    }
    if (!medicine_name) {
      throw createError(400, "Medicine name is required");
    }
    if (!generic_name) {
      throw createError(400, "Generic/Group name is required");
    }
    if (!company_name) {
      throw createError(400, "Company/supplier name is required");
    }
    if (!strength) {
      throw createError(400, "Strength/weight is required");
    }
    if (!dosage_form) {
      throw createError(400, "Dosage form is required");
    }
    if (!purchase_price) {
      throw createError(400, "Purchase price is required");
    }
    if (!sell_price) {
      throw createError(400, "Sell price is required");
    }

    const processedShopName = validateString(shop_name, "Shop");
    const processedMedicineName = validateString(medicine_name, "Medicine");
    const processedGenericName = validateString(generic_name, "Generic");
    const processedCompanyName = validateString(company_name, "Company");
    const processedStrength = strength
      ?.toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\s{2,}/g, " ");
    const processedDosageForm = validateString(dosage_form, "Dosage form");

    const purchasePrice = parseFloat(purchase_price);
    if (!validator.isNumeric(purchase_price) || purchasePrice <= 0) {
      throw createError(400, "Purchase price must be a positive number");
    }

    const sellPrice = parseFloat(sell_price);
    if (!validator.isNumeric(sell_price) || sellPrice <= 0) {
      throw createError(400, "Purchase price must be a positive number");
    }

    if (purchasePrice >= sellPrice) {
      throw createError(400, "Sell price must be more than purchase price");
    }

    const medicineName =
      processedDosageForm +
      " " +
      processedMedicineName +
      " " +
      processedStrength;

    const medicineNameSlug = slugify(medicineName);

    const exists = await medicineCollection.findOne({
      shop_name: processedShopName,
      medicine_title: medicineName,
    });

    if (exists) {
      throw createError(404, "Already exists this medicine");
    }

    const count = await medicineCollection.countDocuments();
    const medicineId = String(count + 1).padStart(12, "0");

    const newMedicine = {
      medicine_id: medicineId,
      medicine_title: medicineName,
      medicine_name: processedMedicineName,
      medicine_title_slug: medicineNameSlug,
      generic_name: processedGenericName,
      company_name: processedCompanyName,
      strength: processedStrength,
      dosage_form: processedDosageForm,
      purchase_price: purchasePrice,
      sell_price: sellPrice,
      shop_name: processedShopName,
      createdAt: new Date(),
    };

    await medicineCollection.insertOne(newMedicine);

    res.status(200).send({
      success: true,
      message: "Medicine created successfully",
      data: newMedicine,
    });
  } catch (error) {
    next(error);
  }
};

export { handleCreateMedicine };
