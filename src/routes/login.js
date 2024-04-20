import express from "express";
import bcrypt from "bcrypt";
import { generateToken } from "../config/jwt.js";
import { User } from "../models/User.js";
import { z } from "zod";

const loginRouter = express.Router();

loginRouter.post("/login", async (req, res) => {
  const loginData = z.object({
    accountNumber: z.string(),
    password: z.string(),
  });
  const data = loginData.parse(req.body);
  try {
    const accountNumberInt = parseInt(data.accountNumber);
    const user = await User.findOne({
      where: {
        accountNumber: accountNumberInt,
      },
    });

    if (!user) {
      return res.status(404).json({ msg: "Account number or password invalid." });
    }

    const passwordMatch = await bcrypt.compare(data.password, user.hashPassword);

    if (passwordMatch) {
      const token = generateToken(user);

      return res.status(200).json({ user, token });
    } else {
      return res.status(401).json({ msg: "Account number or password invalid." });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

export default loginRouter;
