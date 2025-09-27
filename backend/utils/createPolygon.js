const createPolygon = async (req, res) => {
  const { id, area, country, latitude, longitude, polygonCoordinates } =
    req.body;
  try {
    const land = await Lands.create({
      user_id: id,
      land_area: area,
      country: country,
      latitude: latitude,
      longitude: longitude,
      polygon_coordinates: polygonCoordinates,
    });
    const land_id = land.land_id;
    const polygonUrl =
      "http://api.agromonitoring.com/agro/1.0/polygons?appid=test";
    const polygonResponse = await fetch(polygonUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appid: process.env.AGRO_MONITOR_API_KEY,
        name: `${id}+${land_id}`,
        geo_json: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: polygonCoordinates,
          },
        },
      }),
    });
    const polygonData = await polygonResponse.json();
    const polygonId = polygonData.id;
    //adding polygon id to database
    const landWithPolygonId = await Lands.update(
      {
        polygon_id: polygonId,
      },
      {
        where: {
          land_id: land_id,
        },
      }
    );
    res.status(200).json(land);
  } catch (error) {
    res.status(500).send(error);
  }
};
