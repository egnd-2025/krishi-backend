const cockroach = require('../config/sequelize');
const Users = require('../models/users'); 

Users.sync()
  .then(() => {
    console.log('Users table created successfully.');
  })
  .catch(error => {
    console.error('Error creating users table:', error);
  });
