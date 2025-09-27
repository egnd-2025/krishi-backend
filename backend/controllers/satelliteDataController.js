const { getSatelliteData } = require('../utils/getSatelliteData');

exports.satelliteDataController = async (req, res) => {
    const { userId } = req.body;
    try {
        const satelliteData = await getSatelliteData(userId);
        res.status(200).send(satelliteData);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
};