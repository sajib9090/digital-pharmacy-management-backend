import createError from "http-errors";
import { ObjectId } from "mongodb";
import {
  medicineCollection,
  purchaseCollection,
} from "../collections/collections.js";
import { validateString } from "../helper/validateString.js";
import slugify from "slugify";
import validator from "validator";

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

    const newPurchase = {
      shop_name: processedShopName,
      purchase_id: count + 1,
      category: processedCategoryName,
      total_price: totalPrice,
      total_discount: totalDiscount,
      total_tax: totalTax,
      items: items,
      createdAt: new Date(),
    };

    const itemsId = items?.map((item) => item._id);
    const objectIds = itemsId?.map((id) => new ObjectId(id));
    // Check whether all the items exist in database
    const existingItems = await medicineCollection
      .find({ _id: { $in: objectIds } })
      .toArray();

    const allItemsExist = existingItems?.length === itemsId?.length;

    if (!allItemsExist) {
      throw createError(400, "All items not found");
    }

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

export { handleCreatePurchase };
