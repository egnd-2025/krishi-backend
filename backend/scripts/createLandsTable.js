const cockroach = require('../config/sequelize');
const Lands = require('../models/lands');

Lands.sync()
    .then(() => {
        console.log('Lands table created successfully.');
    }
    )
    .catch(error => {
        console.error('Error creating lands table:', error);
    }
    );
