const { Sequelize } = require("sequelize");
const config = require("./config");

const cockroach = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    port: config.development.port,
    dialect: config.development.dialect,
  }
);

module.exports = cockroach;
