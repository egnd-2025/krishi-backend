const { Op } = require("sequelize");

const getUserByIdentifier = async (identifier) => {
  console.log(`getUserByIdentifier: ${identifier}`);
  try {
    const Users = require("../models/users");
    const user = await Users.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });
    return user;
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
};

exports.getUserByIdentifier = getUserByIdentifier;
