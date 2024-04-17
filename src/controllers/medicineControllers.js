import createError from "http-errors";
import { ObjectId } from "mongodb";
import { medicineCollection } from "../collections/collections.js";
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
      stock_left: 0,
      lifetime_supply: 0,
      lifetime_sells: 0,
      createdAt: new Date(),
    };

    await medicineCollection.insertOne(newMedicine);

    res.status(200).send({
      success: true,
      message: "Medicine added successfully",
      data: newMedicine,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetMedicines = async (req, res, next) => {
  try {
    const { shop_name } = req.query;
    const generic_name = req.query.generic_name || "";
    const stock = req.query.stock || "";
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit);

    if (!shop_name) {
      throw createError(400, "shop name is required to find data");
    }

    const processedShopName = validateString(shop_name, "Shop");
    const regExGeneric = new RegExp(".*" + generic_name + ".*", "i");
    const regExSearch = new RegExp(".*" + search + ".*", "i");

    let filter = {
      shop_name: processedShopName,
    };

    if (generic_name) {
      filter.generic_name = { $regex: regExGeneric };
    }

    let sortOption = { medicine_name: 1 };

    if (stock == "low-to-high") {
      sortOption = { stock_left: 1 };
    }
    if (stock == "high-to-low") {
      sortOption = { stock_left: -1 };
    }

    let medicines = await medicineCollection
      .find(filter)
      .sort(sortOption)
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    if (search && medicines.length > 0) {
      medicines = medicines?.filter((medicine) =>
        regExSearch.test(medicine.medicine_name)
      );
    }

    const count = await medicineCollection.countDocuments({
      ...filter,
      medicine_name: { $regex: regExSearch },
    });

    res.status(200).send({
      success: true,
      message: "Retrieved medicines",
      shop_name: processedShopName,
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleMedicine = async (req, res, next) => {
  const { id } = req.query;
  try {
    if (!id) {
      throw createError(400, "Id is required");
    }

    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }

    const exists = await medicineCollection.findOne({ _id: new ObjectId(id) });
    if (!exists) {
      throw createError(404, "No medicine found with this Id");
    }

    res.status(200).send({
      success: true,
      message: "Retrieved single medicine",
      data: exists,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }

    const exists = await medicineCollection.findOne({ _id: new ObjectId(id) });
    if (!exists) {
      throw createError(404, "No such medicine found.");
    }

    const deleteCount = await medicineCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (!deleteCount?.deletedCount) {
      throw createError(400, "Something went wrong when try to delete");
    }

    res.status(200).send({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  handleCreateMedicine,
  handleGetMedicines,
  handleGetSingleMedicine,
  handleDeleteMedicine,
};
