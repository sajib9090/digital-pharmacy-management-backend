import createError from "http-errors";
import { ObjectId } from "mongodb";
import { genericCollection } from "../collections/collections.js";
import { validateString } from "../helper/validateString.js";

const handleCreateGeneric = async (req, res, next) => {
  const { generic_name, shop_name } = req.body;

  try {
    if (!generic_name) {
      throw createError(400, "generic name is required");
    }
    if (!shop_name) {
      throw createError(400, "shop name is required");
    }

    const processedGeneric = validateString(generic_name, "generic");
    const processedShopName = validateString(shop_name, "shop name");

    const existingName = await genericCollection.findOne({
      generic_name: processedGeneric,
      shop_name: processedShopName,
    });

    if (existingName) {
      throw createError(400, "already exists this generic name");
    }

    const count = await genericCollection.countDocuments();
    const genericId = String(count + 1).padStart(10, "0");

    const newGeneric = {
      generic_id: genericId,
      generic_name: processedGeneric,
      shop_name: processedShopName,
      createdAt: new Date(),
    };

    await genericCollection.insertOne(newGeneric);

    res.status(200).send({
      success: true,
      message: "generic created successfully",
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

    const count = await genericCollection.find(filter).count();

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

// const handleGetAllGenericWithPagination = async(req, res, next) => {
//   try {

//   } catch (error) {
//     next(error)
//   }
// }

export { handleCreateGeneric, handleGetAllGeneric };
