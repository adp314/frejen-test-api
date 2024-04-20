import express from "express";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import bcrypt from "bcrypt";

const createRouter = express.Router();


createRouter.post("/create-user", async (req, res) => {
  const data = req.body;

  try {
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await User.create({
        accountNumber: data.number,
        hashPassword: hashedPassword,
        role: data.role,
      });
      if (user) {
        return res.status(200).json(user);
      } else {
        return res.status(200).json("erreur");
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

createRouter.post("/create-product", async (req, res) => {
  const data = req.body;

  try {
    const product = await Product.create({
      image: data.image || null,
      brand: data.brand || null,
      name: data.name,
      quantity: data.quantity,
    });
    if (product) {
      return res.status(200).json(product);
    } else {
      return res.status(200).json("erreur");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

export default createRouter;
