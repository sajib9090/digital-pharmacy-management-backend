import createError from "http-errors";
import { ObjectId } from "mongodb";
import { companyCollection } from "../collections/collections.js";
import { medicineCollection } from "../collections/collections.js";
import { validateString } from "../helper/validateString.js";
import slugify from "slugify";

const handleCreateCompany = async (req, res, next) => {
  const { company_name, shop_name } = req.body;
  try {
    if (!company_name) {
      throw createError(400, "Company/supplier name is required");
    }
    if (!shop_name) {
      throw createError(400, "Shop name is required");
    }
    const processedCompany = validateString(company_name, "Company");
    const processedShopName = validateString(shop_name, "Shop name");

    const company_slug = slugify(processedCompany);
    const shop_slug = slugify(processedShopName);

    const existingName = await companyCollection.findOne({
      company_name: processedCompany,
      shop_name: processedShopName,
    });

    if (existingName) {
      throw createError(400, "Already exists this company/supplier");
    }

    const count = await companyCollection.countDocuments();
    const companyId = String(count + 1).padStart(10, "0");

    const newCompany = {
      company_id: companyId,
      company_name: processedCompany,
      shop_name: processedShopName,
      company_slug,
      shop_slug,
      createdAt: new Date(),
    };

    await companyCollection.insertOne(newCompany);

    res.status(200).send({
      success: true,
      message: "Company created successfully",
      data: newCompany,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetAllCompany = async (req, res, next) => {
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
      $or: [{ company_name: { $regex: regExSearch } }],
    };

    const companies = await companyCollection
      .find(filter)
      .sort({ company_name: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    for (const company of companies) {
      const medicine_available = await medicineCollection.countDocuments({
        shop_name: processedShopName,
        company_name: company?.company_name,
      });

      company.medicine_available = medicine_available;
    }

    const count = await companyCollection.countDocuments(filter);

    res.status(200).send({
      success: true,
      message: "Companies retrieved successfully",
      shop_name: processedShopName,
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: companies,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleCompany = async (req, res, next) => {
  const { id } = req.query;
  try {
    if (!id) {
      throw createError(400, "Id is required");
    }

    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }

    const exists = await companyCollection.findOne({ _id: new ObjectId(id) });
    if (!exists) {
      throw createError(404, "No company found with this Id");
    }

    const medicineAvailable = await medicineCollection
      .find({
        shop_name: exists?.shop_name,
        company_name: exists?.company_name,
      })
      .toArray();

    const result = {
      ...exists,
      medicine_available: medicineAvailable,
    };

    res.status(200).send({
      success: true,
      message: "Company retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }

    const exists = await companyCollection.findOne({ _id: new ObjectId(id) });
    if (!exists) {
      throw createError(404, "No such company found.");
    }

    const deleteCount = await companyCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (!deleteCount?.deletedCount) {
      throw createError(400, "Something went wrong when try to delete");
    }

    res.status(200).send({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  handleCreateCompany,
  handleGetAllCompany,
  handleGetSingleCompany,
  handleDeleteCompany,
};
