import jwt from "jsonwebtoken";

export function generateToken(user) {
  const { accountNumber, role } = user;

  const signature = process.env.TOKEN_SIGN_SECRET;
  if (!signature) {
    throw new Error("Token sign secret is not defined");
  }

  const expiration = "12h";

  return jwt.sign({ accountNumber, role }, signature, {
    expiresIn: expiration,
  });
}
