import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import loginRouter from "./routes/login.js";
import create from "./routes/create.js";
import productRouter from "./routes/product.js";
import requestRouter from "./routes/request.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use(cors());

app.use(`/api`, loginRouter);
app.use(`/api`, create);
app.use(`/api`, productRouter);
app.use(`/api`, requestRouter);

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
