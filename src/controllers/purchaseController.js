import createError from "http-errors";
import { ObjectId } from "mongodb";
import {
  medicineCollection,
  purchaseCollection,
} from "../collections/collections.js";
import { validateString } from "../helper/validateString.js";

const handleCreatePurchase = async (req, res, next) => {
  const { shop_name } = req.query;
  const {
    category,
    total_price,
    total_discount = "0",
    total_tax = "0",
    items,
  } = req.body;
  try {
    if (!shop_name) {
      throw createError(400, "Shop name is required in query");
    }
    if (!category) {
      throw createError(400, "Category name is required");
    }
    if (!total_price) {
      throw createError(400, "Total price is required");
    }
    if (!items) {
      throw createError(400, "Items is required");
    }
    if (items?.length < 1) {
      throw createError(400, "Items should be at least one");
    }
    const processedShopName = validateString(shop_name, "Shop");
    const processedCategoryName = validateString(category, "Category");

    const totalPrice = parseFloat(total_price);
    if (isNaN(totalPrice) || totalPrice <= 0) {
      throw createError(400, "Total price must be a positive number");
    }

    const totalDiscount = parseFloat(total_discount);
    if (isNaN(totalDiscount) || totalDiscount < 0) {
      throw createError(
        400,
        "Total discount must be a positive number or zero"
      );
    }

    const totalTax = parseFloat(total_tax);
    if (isNaN(totalTax) || totalTax < 0) {
      throw createError(400, "Total tax must be a positive number or zero");
    }

    const count = await purchaseCollection.countDocuments({
      shop_name: processedShopName,
    });

    const itemsId = items?.map((item) => item._id);
    const companyName = items?.map((item) => item?.company_name);
    const objectIds = itemsId?.map((id) => new ObjectId(id));

    // Check whether all the items exist in database
    const existingItems = await medicineCollection
      .find({ _id: { $in: objectIds } })
      .toArray();

    const allItemsExist = existingItems?.length === itemsId?.length;

    if (!allItemsExist) {
      throw createError(400, "All items not found");
    }

    const newPurchase = {
      shop_name: processedShopName,
      purchase_id: count + 1,
      company_name: companyName[0],
      category: processedCategoryName,
      total_price: totalPrice,
      total_discount: totalDiscount,
      total_tax: totalTax,
      items: items,
      createdAt: new Date(),
    };

    for (const item of items) {
      const existingItem = existingItems.find(
        (i) => i._id.toString() === item._id
      );

      if (existingItem) {
        const updatedStock = existingItem.stock_left + item.purchase_quantity;
        const updatedLifetimeSupply =
          existingItem.lifetime_supply + item.purchase_quantity;
        await medicineCollection.updateOne(
          { _id: existingItem._id },
          {
            $set: {
              stock_left: updatedStock,
              lifetime_supply: updatedLifetimeSupply,
              updatedAt: new Date(),
            },
          }
        );
      }
    }

    const newData = await purchaseCollection.insertOne(newPurchase);

    res.status(200).send({
      success: true,
      message: "Purchase created successfully.",
      data: newData,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetPurchaseInvoice = async (req, res, next) => {
  const { shop_name } = req.query;
  const company_name = req.query.company_name || "";
  let startDate = req.query.startDate || "";
  let endDate = req.query.endDate || "";
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit);
  const search = req.query.search || "";
  const price = req.query.price || "";
  const category = req.query.category || "";

  try {
    if (!shop_name) {
      throw createError(400, "Shop name is required in query");
    }
    const processedShopName = validateString(shop_name, "Shop");

    const regExCategory = new RegExp(".*" + category + ".*", "i");
    const regExCompanyName = new RegExp(".*" + company_name + ".*", "i");
    const regExSearch = new RegExp(".*" + search + ".*", "i");

    let filter = {
      shop_name: processedShopName,
    };

    if (company_name) {
      filter.company_name = { $regex: regExCompanyName };
    }

    if (category) {
      filter.category = { $regex: regExCategory };
    }

    if (search) {
      if (search.length == 24) {
        filter.$or = [{ _id: new ObjectId(search) }];
      } else {
        filter.$or = [
          { company_name: { $regex: regExSearch } },
          { category: { $regex: regExSearch } },
        ];
      }
    }

    let sortOption = { createdAt: 1 };

    if (price == "low-to-high") {
      sortOption = { total_price: 1 };
    }
    if (price == "high-to-low") {
      sortOption = { total_price: -1 };
    }

    if (startDate) {
      startDate = new Date(startDate);
      startDate.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: startDate };
    }

    if (endDate) {
      endDate = new Date(endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = { ...filter.createdAt, $lte: endDate };
    }

    const invoices = await purchaseCollection
      .find(filter)
      .sort(sortOption)
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const countFilter = { ...filter };
    if (search) {
      countFilter.$or = [
        { company_name: { $regex: regExSearch } },
        { _id: { $regex: regExSearch } },
      ];
    }

    const count = await purchaseCollection.countDocuments(countFilter);

    res.status(200).send({
      success: true,
      message: "Purchase invoices retrieved successfully",
      shop_name: processedShopName,
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

export { handleCreatePurchase, handleGetPurchaseInvoice };
