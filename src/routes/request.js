import express from "express";
import { Request } from "../models/Request.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import jwtCheck from "../middlewares/jwtCheck.js";
import { isRequester } from "../middlewares/isRequester.js";
import { isManager } from "../middlewares/isManager.js";
import { ProductReserved } from "../models/ProductReserved.js";
import { ProductOrdered } from "../models/ProductOrdered.js";
import { z } from "zod";

const requestRouter = express.Router();

// CREATION REQUEST
requestRouter.post("/create-request", jwtCheck, isRequester, async (req, res) => {
  const createRequestData = z.object({
    date: z.string(),
    type: z.string(),
    userId: z.number(),
    products: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        brand: z.string().optional(),
        image: z.string().optional(),
        quantity: z.number(),
      })
    ),
    freeProducts: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.number(),
        })
      )
      .optional(),
  });
  const code = Math.floor(1000 + Math.random() * 9000);
  const data = createRequestData.parse(req.body);

  try {
    const user = await User.findOne({ where: { id: data.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const request = await Request.create({
      date: data.date,
      type: data.type,
      userId: data.userId,
      code: code,
      status: "PENDING",
      freeProducts: JSON.stringify(data.freeProducts),
    });

    for (const product of data.products) {
      let createdProduct;
      if (data.type === "RESERVATION") {
        const { id, name, quantity } = product;
        createdProduct = await ProductReserved.create({
          productId: id,
          name,
          reservedQuantity: quantity,
        });
        await request.addProductReserved(createdProduct);
        const updatedProduct = await Product.findOne({ where: { id: id } });
        if (updatedProduct) {
          updatedProduct.quantity -= quantity;
          await updatedProduct.save();
        }
      } else if (data.type === "ORDER") {
        const { id } = product;
        createdProduct = await ProductOrdered.create({
          productId: id,
          name: product.name,
          quantity: product.quantity,
        });
        await request.addProductOrdered(createdProduct);
      }
    }
    return res.status(200).json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

// FETCH
requestRouter.get("/all-requests/:userId", jwtCheck, async (req, res) => {
  const userId = req.params.userId;

  try {
    const requests = await Request.findAll({ where: { userId: userId }, include: [{ model: ProductOrdered, ProductReserved }] });

    if (!requests || requests.length === 0) {
      return res.status(400).json({ error: "No requests found." });
    }
    return res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

// FETCH STORAGE MANAGER
requestRouter.get("/all-requests", async (req, res) => {
  try {
    const requests = await Request.findAll({
      include: [ProductOrdered, ProductReserved],
    });

    if (!requests || requests.length === 0) {
      return res.status(400).json({ error: "No requests found." });
    }
    return res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

// FETCH REQUESTER
requestRouter.get("/request/:requestId", jwtCheck, async (req, res) => {
  const requestId = req.params.requestId;

  try {
    const request = await Request.findOne({
      where: { id: requestId },
      include: [ProductOrdered, ProductReserved],
    });

    if (!request) {
      return res.status(400).json({ error: "Invalid request ID." });
    }
    return res.status(200).json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

// VALIDATION
requestRouter.put("/request-validation", jwtCheck, isManager, async (req, res) => {
  const createValidationData = z.object({
    userId: z.number().optional(),
    requestId: z.number(),
  });
  const data = createValidationData.parse(req.body);
  try {
    const request = await Request.findOne({ where: { id: data.requestId }, include: [ProductOrdered, ProductReserved] });
    if (!request) {
      return res.status(400).json({ error: "Invalid request ID." });
    }
    if (request.type === "RESERVATION") {
      for (const productReserved of request.productReserveds) {
        const product = await Product.findOne({ where: { id: productReserved.productId } });
        if (product) {
          product.quantity += productReserved.reservedQuantity;
          await product.save();
        }
      }
    } else if (request.type === "ORDER") {
      if (request.freeProducts && Object.keys(JSON.parse(request.freeProducts)).length > 0) {
        const freeProducts = JSON.parse(request.freeProducts);
        const freeProductsArray = Object.entries(freeProducts);
        for (const [name, quantity] of freeProductsArray) {
          const parsedQuantity = parseInt(quantity);
          if (!isNaN(parsedQuantity)) {
            const newProduct = await ProductOrdered.create({
              name: name,
              quantity: parsedQuantity,
            });
            await request.addProductOrdered(newProduct);
          } else {
            console.error(`Invalid quantity for product ${name}: ${quantity}`);
          }
        }
      }
      for (const productOrdered of request.productOrdereds) {
        const dbProduct = await Product.findOne({ where: { id: productOrdered.productId } });
        if (!dbProduct) {
          return res.status(404).json({ error: `Product with ID ${productOrdered.productId} not found.` });
        }
        const remainingQuantity = dbProduct.quantity - productOrdered.quantity;
        if (remainingQuantity < 0) {
          return res.status(400).json({ error: `Insufficient stock for product ${dbProduct.name}.` });
        }
        dbProduct.quantity = remainingQuantity;
        await dbProduct.save();
      }
    }
    request.status = "VALIDATED";
    await request.save();
    return res.status(200).json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

// CANCEL
requestRouter.put("/cancel-request", jwtCheck, async (req, res) => {
  const createCancelationData = z.object({
    userId: z.number().optional(),
    requestId: z.number(),
  });
  const data = createCancelationData.parse(req.body);
  try {
    const request = await Request.findOne({
      where: { id: data.requestId },
      include: { model: ProductReserved },
    });

    if (!request) {
      return res.status(400).json({ error: "Invalid request ID." });
    }

    if (request.type === "RESERVATION") {
      for (const productReserved of request.productReserveds) {
        const product = await Product.findOne({ where: { id: productReserved.productId } });
        if (product) {
          product.quantity += productReserved.reservedQuantity;
          await product.save();
        }
      }
    }
    request.status = "CANCELED";
    await request.save();
    return res.status(200).json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

export default requestRouter;
