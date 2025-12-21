// ============================================
// User Model (Sequelize)
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employeeId: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      field: "employee_id",
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING(100),
      field: "last_name",
    },
    departmentId: {
      type: DataTypes.INTEGER,
      field: "department_id",
    },
    position: {
      type: DataTypes.STRING(100),
    },
    role: {
      type: DataTypes.ENUM("employee", "head", "admin"),
      defaultValue: "employee",
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      field: "supervisor_id",
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "profile_image",
      comment: "Path to profile image file",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
