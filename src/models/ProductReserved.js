import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { Request } from "./Request.js";
import { Product } from "./Product.js";

export const ProductReserved = sequelize.define("productReserved", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reservedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

ProductReserved.belongsTo(Product);
Product.hasMany(ProductReserved);

ProductReserved.belongsTo(Request);
Request.hasMany(ProductReserved);
