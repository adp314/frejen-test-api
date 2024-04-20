import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { User } from "./User.js";

export const Request = sequelize.define("request", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  code: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  freeProducts: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

Request.belongsTo(User);
