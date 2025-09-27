const { Op } = require("sequelize");
const Land = require("../models/lands");
const axios = require("axios");
require("dotenv").config();

const getLandData = async (userId) => {
  const land = await Land.findOne({
    where: {
      user_id: userId,
      polygon_id: {
        [Op.not]: null,
      },
    },
  });
  return land;
};

const getSatelliteData = async (userId) => {
  const apiKey = process.env.OPENWEATHERMAPS_KEY;
  
  if (!apiKey) {
    throw new Error('OpenWeatherMap API key is required for One Call API 3.0');
  }
  
  const landData = await getLandData(userId);
  console.log(`landData: ${landData}`);
  const { polygon_id, latitude, longitude, country, land_area } = landData;
  
  // One Call API 3.0 endpoint with units parameter for better data consistency
  const urlRain = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=daily,alerts&units=metric&appid=${apiKey}`;
  
  try {
    const responseRain = await axios.get(urlRain);
    const weatherData = await responseRain.data;
    
    const currentTemp = weatherData.current.temp;
    const currentHumidity = weatherData.current.humidity;
    const currentWeather = weatherData.current.weather[0].description;
    const icon = `http://openweathermap.org/img/w/${weatherData.current.weather[0].icon}.png`;
    const rainChancesNextHour = weatherData.hourly[1].pop;
    const agriData = await getAgriData(polygon_id, latitude, longitude);
    const { currentUvi, latestMedianNDVI, colourCode, windSpeed, windDeg, windGust, message } = agriData;
    
    return {
      currentUvi: currentUvi,
      latestMedianNDVI: latestMedianNDVI,
      colourCode: colourCode,
      windSpeed: windSpeed,
      windDeg: windDeg,
      windGust: windGust,
      message: message,
      currentTemp: currentTemp,
      currentHumidity: currentHumidity,
      currentWeather: currentWeather,
      icon: icon,
      rainChancesNextHour: rainChancesNextHour,
    };
  } catch (error) {
    console.error('Error fetching weather data from One Call API 3.0:', error.message);
    if (error.response) {
      console.error('API Response Status:', error.response.status);
      console.error('API Response Data:', error.response.data);
      
      // Handle specific API errors
      if (error.response.status === 401) {
        throw new Error('Invalid API key for One Call API 3.0. Please check your subscription and API key.');
      } else if (error.response.status === 429) {
        throw new Error('API rate limit exceeded. One Call API 3.0 has a pay-as-you-call model with 1,000 free calls per day.');
      } else if (error.response.status === 403) {
        throw new Error('Access forbidden. Please ensure you have an active One Call API 3.0 subscription.');
      }
    }
    throw error;
  }
};

const getAgriData = async (polygon_id, latitude, longitude) => {
  const agriKey = process.env.AGRO_MONITOR_API_KEY;
  const id = polygon_id;
  const lat = latitude;
  const lon = longitude;
  const endTime = Math.round(+new Date() / 1000);
  const startTime = endTime - 15 * 86400;
  const urlNDVIAgri = `http://api.agromonitoring.com/agro/1.0/ndvi/history?start=${startTime}&end=${endTime}&polyid=${id}&appid=${agriKey}`;
  const urlUviAgri = `http://api.agromonitoring.com/agro/1.0/uvi?polyid=${id}&appid=${agriKey}`;
  const urlWeatherAgri = `https://api.agromonitoring.com/agro/1.0/weather?lat=${lat}}&lon=${lon}&appid=${agriKey}`;
  const responseWeather = await axios.get(urlWeatherAgri);
  const responseNDVI = await axios.get(urlNDVIAgri);
  const responseUvi = await axios.get(urlUviAgri);
  const NDVIData = await responseNDVI.data;
  const UviData = await responseUvi.data;
  const weatherData = await responseWeather.data;
  const windData = weatherData.wind;
  const currentUvi = UviData.uvi;
  const lastestMedianNDVI = NDVIData[0].data.median;
  let colourCode = "";
  let message = "";
  if (currentUvi < 2) {
    colourCode = "#4671c6";
    message = "Low UV index. No protection required!";
  } else if (currentUvi < 5) {
    colourCode = "#a4c9ff";
    message = "Moderate UV index. Protection required!";
  } else if (currentUvi < 7) {
    colourCode = "#6bdddd";
    message = "Moderate UV index. Protection required!";
  } else if (currentUvi < 10) {
    colourCode = "#ffea92";
    message = "High UV index. Extra protection required!";
  } else if (currentUvi > 10) {
    colourCode = "#f9a7a7";
    message = "Extreme UV index. Extra protection required!";
  }
  return {
    currentUvi: currentUvi,
    latestMedianNDVI: lastestMedianNDVI,
    colourCode: colourCode,
    windSpeed: windData.speed,
    windDeg: windData.deg,
    windGust: windData.gust,
    message: message,
  };
};

exports.getSatelliteData = getSatelliteData;