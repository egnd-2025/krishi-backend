const { Op } = require("sequelize");
const { getUserByIdentifier } = require("../utils/getUserByIdentifier");
const Users = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check if email or username exists
    const existingUser = await Users.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    if (existingUser) {
      return res
        .status(409)
        .send({ error: "Email or Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
    });
    //save jwt fix
    const token = jwt.sign(
      { userId: newUser.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const userToSend = {
      username: newUser.username,
      email: newUser.email,
      id: newUser.id,
    };

    res
      .status(201)
      .json({ success: "User created successfully", token, user: userToSend });
  } catch (error) {
    res.status(500).send({ error: error });
  }
};

exports.signin = async (req, res, next) => {
  const { identifier, password } = req.body;

  try {
    // Find user by email or username
    const user = await getUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: "Incorrect password" });
    }

    // Sign in successful
    const token = jwt.sign({ userId: user.username }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    const userToSend = {
      username: user.username,
      email: user.email,
      id: user.id,
    };

    res.status(200).json({
      success: "User signed in successfully",
      token,
      user: userToSend,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
