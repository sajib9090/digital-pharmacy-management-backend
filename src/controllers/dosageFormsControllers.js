import createError from "http-errors";
import { ObjectId } from "mongodb";
import { medicineCollection } from "../collections/collections.js";
import { dosageCollection } from "../collections/collections.js";
import { validateString } from "../helper/validateString.js";
import slugify from "slugify";

const handleCreateDosageForm = async (req, res, next) => {
  const { dosage_form, shop_name } = req.body;
  try {
    if (!dosage_form) {
      throw createError(400, "Dosage form is required");
    }
    if (!shop_name) {
      throw createError(400, "Shop name is required");
    }
    const processedDosageForm = validateString(dosage_form, "Dosage form");
    const processedShopName = validateString(shop_name, "Shop name");

    const dosage_form_slug = slugify(processedDosageForm);
    const shop_slug = slugify(processedShopName);

    const existingDosage = await dosageCollection.findOne({
      dosage_form: processedDosageForm,
      shop_name: processedShopName,
    });

    if (existingDosage) {
      throw createError(400, "Already exists this dosage form");
    }

    const count = await dosageCollection.countDocuments();
    const dosageId = String(count + 1).padStart(10, "0");

    const newDosageForm = {
      dosage_id: dosageId,
      dosage_form: processedDosageForm,
      shop_name: processedShopName,
      dosage_form_slug,
      shop_slug,
      createdAt: new Date(),
    };

    await dosageCollection.insertOne(newDosageForm);

    res.status(200).send({
      success: true,
      message: "Dosage form created successfully",
      data: newDosageForm,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetAllDosage = async (req, res, next) => {
  try {
    const { shop_name } = req.query;
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;

    if (!shop_name) {
      throw createError(400, "shop name is required to find data");
    }

    const regExSearch = new RegExp(".*" + search + ".*", "i");
    const processedShopName = validateString(shop_name, "shop name");

    const filter = {
      shop_name: processedShopName,
      $or: [{ dosage_form: { $regex: regExSearch } }],
    };

    const dosageForms = await dosageCollection
      .find(filter)
      .sort({ dosage_form: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    for (const dosage of dosageForms) {
      const medicine_available = await medicineCollection
        .find({
          shop_name: processedShopName,
          dosage_form: dosage?.dosage_form,
        })
        .count();

      dosage.medicine_available = medicine_available;
    }

    const count = await dosageCollection.find(filter).count();

    res.status(200).send({
      success: true,
      message: "Dosage forms retrieved successfully",
      shop_name: processedShopName,
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: dosageForms,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteDosageForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }

    const exists = await dosageCollection.findOne({ _id: new ObjectId(id) });
    if (!exists) {
      throw createError(404, "No such dosage form found.");
    }

    const deleteCount = await dosageCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (!deleteCount?.deletedCount) {
      throw createError(400, "Something went wrong when try to delete");
    }

    res.status(200).send({
      success: true,
      message: "Dosage form deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { handleCreateDosageForm, handleGetAllDosage, handleDeleteDosageForm };
