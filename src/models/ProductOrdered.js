import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { Request } from "./Request.js";
import { Product } from "./Product.js";

export const ProductOrdered = sequelize.define("productOrdered", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

ProductOrdered.belongsTo(Product);
Product.hasMany(ProductOrdered);

ProductOrdered.belongsTo(Request);
Request.hasMany(ProductOrdered);
