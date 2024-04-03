import createError from "http-errors";
import { ObjectId } from "mongodb";
import { genericCollection } from "../collections/collections.js";
import { medicineCollection } from "../collections/collections.js";
import { validateString } from "../helper/validateString.js";
import slugify from "slugify";

const handleCreateGeneric = async (req, res, next) => {
  const { generic_name, shop_name } = req.body;

  try {
    if (!generic_name) {
      throw createError(400, "Generic name is required");
    }
    if (!shop_name) {
      throw createError(400, "Shop name is required");
    }

    const processedGeneric = validateString(generic_name, "Generic");
    const processedShopName = validateString(shop_name, "Shop name");

    const generic_slug = slugify(processedGeneric);
    const shop_slug = slugify(processedShopName);

    const existingName = await genericCollection.findOne({
      generic_name: processedGeneric,
      shop_name: processedShopName,
    });

    if (existingName) {
      throw createError(400, "Already exists this generic name");
    }

    const count = await genericCollection.countDocuments();
    const genericId = String(count + 1).padStart(14, "0");

    const newGeneric = {
      generic_id: genericId,
      generic_name: processedGeneric,
      shop_name: processedShopName,
      generic_slug,
      shop_slug,
      createdAt: new Date(),
    };

    await genericCollection.insertOne(newGeneric);

    res.status(200).send({
      success: true,
      message: "Generic created successfully",
      data: newGeneric,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetAllGeneric = async (req, res, next) => {
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
      $or: [{ generic_name: { $regex: regExSearch } }],
    };

    const generics = await genericCollection
      .find(filter)
      .sort({ generic_name: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    for (const generic of generics) {
      const medicine_available = await medicineCollection.countDocuments({
        shop_name: processedShopName,
        generic_name: generic.generic_name,
      });

      generic.medicine_available = medicine_available;
    }

    const count = await genericCollection.countDocuments(filter);

    res.status(200).send({
      success: true,
      message: "generics retrieved successfully",
      shop_name: processedShopName,
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: generics,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleGeneric = async (req, res, next) => {
  const { id } = req.query;
  try {
    if (!id) {
      throw createError(400, "Id is required");
    }

    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }

    const exists = await genericCollection.findOne({ _id: new ObjectId(id) });
    if (!exists) {
      throw createError(404, "No generic found with this Id");
    }

    const medicineAvailable = await medicineCollection
      .find({
        shop_name: exists?.shop_name,
        generic_name: exists?.generic_name,
      })
      .toArray();

    const result = {
      ...exists,
      medicine_available: medicineAvailable,
    };

    res.status(200).send({
      success: true,
      message: "Generic retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteGeneric = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }

    const exists = await genericCollection.findOne({ _id: new ObjectId(id) });
    if (!exists) {
      throw createError(404, "No such generic found.");
    }

    const deleteCount = await genericCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (!deleteCount?.deletedCount) {
      throw createError(400, "Something went wrong when try to delete");
    }

    res.status(200).send({
      success: true,
      message: "Generic deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  handleCreateGeneric,
  handleGetAllGeneric,
  handleGetSingleGeneric,
  handleDeleteGeneric,
};
