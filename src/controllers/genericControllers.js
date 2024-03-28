import createError from "http-errors";
import { ObjectId } from "mongodb";

import { genericCollection } from "../collections/collections.js";

const handleCreateGeneric = async (req, res, next) => {
  try {
    res.status(200).send({
      success: true,
      message: "generic created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { handleCreateGeneric };
