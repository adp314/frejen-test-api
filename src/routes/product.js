import express from "express";
import { Product } from "../models/Product.js";
import jwtCheck from "../middlewares/jwtCheck.js";

const productRouter = express.Router();

productRouter.get("/product", jwtCheck, async (req, res) => {
  try {
    const allProducts = await Product.findAll();

    if (!allProducts) {
      return res.status(404).json({ msg: "No products in this data table." });
    }

    return res.status(200).json(allProducts);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

export default productRouter;
