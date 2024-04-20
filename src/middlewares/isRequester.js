import { User } from "../models/User.js";

export async function isRequester(req, res, next) {
  const userId = req.body.userId;

  try {
    const user = await User.findOne({ where: userId });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    if (user.role !== "REQUESTER") {
      return res.status(401).json({ msg: "User unauthorized." });
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}
