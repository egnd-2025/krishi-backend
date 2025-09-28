// Enhanced Agentic Recommendation System
const { OpenAI } = require("openai");
const axios = require("axios");
const { getSatelliteData } = require("./getSatelliteData");
const { gptRecommendation } = require("./gptRecommendations");
const Land = require("../models/lands");
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// Fetch products from merchant
const fetchProductsFromMerchant = async () => {
  try {
    const merchantUrl = process.env.MERCHANT_URL || "http://localhost:4021";
    const response = await axios.get(`${merchantUrl}/products/all`);
    return response.data;
  } catch (error) {
    console.error("Error fetching products from merchant:", error.message);
    throw error;
  }
};

// Analyze soil and land conditions
const analyzeLandConditions = async (userId) => {
  try {
    const landData = await Land.findOne({
      where: { user_id: userId }
    });

    if (!landData) {
      throw new Error("No land data found for user");
    }

    // Get satellite data - handle case where polygon_id might be null
    let satelliteData;
    try {
      satelliteData = await getSatelliteData(userId);
    } catch (error) {
      console.warn("Satellite data unavailable, using fallback data:", error.message);
      // Use fallback data when satellite data is not available
      satelliteData = {
        currentTemp: 25,
        currentHumidity: 60,
        currentWeather: "clear sky",
        latestMedianNDVI: 0.5,
        currentUvi: 5,
        windSpeed: 3.5,
        rainChancesNextHour: 20
      };
    }
    
    return {
      land: {
        area: landData.land_area,
        country: landData.country,
        latitude: landData.latitude,
        longitude: landData.longitude
      },
      conditions: {
        temperature: satelliteData.currentTemp,
        humidity: satelliteData.currentHumidity,
        weather: satelliteData.currentWeather,
        ndvi: satelliteData.latestMedianNDVI,
        uvIndex: satelliteData.currentUvi,
        windSpeed: satelliteData.windSpeed,
        rainProbability: satelliteData.rainChancesNextHour
      }
    };
  } catch (error) {
    console.error("Error analyzing land conditions:", error.message);
    throw error;
  }
};

// Truly agentic crop recommendation using AI
const generateAgenticCropRecommendations = async (landAnalysis, availableCrops) => {
  const prompt = `You are an expert agricultural AI. Based on the following land and environmental data, recommend the top 5 crops with specific reasoning:

LAND DATA:
- Area: ${landAnalysis.land.area} hectares
- Country: ${landAnalysis.land.country}
- Location: ${landAnalysis.land.latitude}, ${landAnalysis.land.longitude}

ENVIRONMENTAL CONDITIONS:
- Temperature: ${landAnalysis.conditions.temperature}°C
- Humidity: ${landAnalysis.conditions.humidity}%
- Weather: ${landAnalysis.conditions.weather}
- NDVI (Soil Health): ${landAnalysis.conditions.ndvi}
- UV Index: ${landAnalysis.conditions.uvIndex}
- Wind Speed: ${landAnalysis.conditions.windSpeed} m/s
- Rain Probability: ${landAnalysis.conditions.rainProbability}%

AVAILABLE CROPS: ${availableCrops.join(", ")}

For each recommended crop, provide:
1. Crop name
2. Suitability score (0-100)
3. Specific reasons why it's suitable
4. Expected yield potential
5. Risk factors to consider

Format as JSON array with fields: name, score, reasons[], yieldPotential, risks[]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    const aiRecommendations = JSON.parse(response.choices[0].message.content);
    return aiRecommendations;
  } catch (error) {
    console.error("Error generating AI crop recommendations:", error);
    // Fallback to rule-based system
    return generateFallbackCropRecommendations(landAnalysis);
  }
};

// Truly agentic product recommendations using AI - returns format compatible with automated ordering
const generateAgenticProductRecommendations = async (cropRecommendations, landAnalysis, availableProducts) => {
  const prompt = `You are an expert agricultural AI. Based on the recommended crops and land conditions, suggest specific products from the available catalog with intelligent quantities.

RECOMMENDED CROPS:
${cropRecommendations.map(c => `- ${c.name} (Score: ${c.score}/100)`).join('\n')}

LAND CONDITIONS:
- Area: ${landAnalysis.land.area} square feet (${(landAnalysis.land.area / 10764).toFixed(2)} hectares)
- Temperature: ${landAnalysis.conditions.temperature}°C
- Humidity: ${landAnalysis.conditions.humidity}%
- Soil Health (NDVI): ${landAnalysis.conditions.ndvi}
- Weather: ${landAnalysis.conditions.weather}

AVAILABLE PRODUCTS CATALOG:
SEEDS: ${availableProducts.seeds.map(s => `${s.name} ($${s.price}/${s.unit})`).join(', ')}
FERTILIZERS: ${availableProducts.fertilizers.map(f => `${f.name} ($${f.price}/${f.unit})`).join(', ')}
TOOLS: ${availableProducts.tools.map(t => `${t.name} ($${t.price}/${t.unit})`).join(', ')}
PESTICIDES: ${availableProducts.pesticides.map(p => `${p.name} ($${p.price}/${p.unit})`).join(', ')}

QUANTITY CALCULATION RULES:
- For seeds: 20-30 kg per hectare
- For fertilizers: 80-120 kg per hectare  
- For pesticides: 1-3 liters per hectare
- For tools: 1-2 pieces (not area dependent)
- Calculate based on the hectare area shown above

IMPORTANT: You must return recommendations in EXACTLY this JSON format that matches our automated ordering system:

[
  {
    "type": "seed|fertilizer|tool|pesticide",
    "product": {
      "name": "exact product name from catalog",
      "price": number,
      "unit": "kg|liter|piece",
      "description": "product description"
    },
    "quantity": number,
    "priority": "high|medium|low",
    "reason": "specific reasoning for this recommendation"
  }
]

Requirements:
1. Use EXACT product names from the available catalog
2. Calculate intelligent quantities based on land area (${landAnalysis.land.area} hectares)
3. Prioritize high-priority items for essential farming needs
4. Include reasoning for each recommendation
5. Consider crop-specific requirements and soil conditions
6. Limit to 8-12 total recommendations to avoid overwhelming the farmer

Return ONLY the JSON array, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const aiRecommendations = JSON.parse(response.choices[0].message.content);
    
    // Validate and ensure products exist in catalog
    const validatedRecommendations = aiRecommendations.map(rec => {
      const productType = rec.type;
      const productName = rec.product.name;
      
      // Find the actual product from catalog
      let actualProduct = null;
      if (productType === 'seed') {
        actualProduct = availableProducts.seeds.find(s => s.name === productName);
      } else if (productType === 'fertilizer') {
        actualProduct = availableProducts.fertilizers.find(f => f.name === productName);
      } else if (productType === 'tool') {
        actualProduct = availableProducts.tools.find(t => t.name === productName);
      } else if (productType === 'pesticide') {
        actualProduct = availableProducts.pesticides.find(p => p.name === productName);
      }
      
      if (actualProduct) {
        return {
          ...rec,
          product: actualProduct // Use the actual product object from catalog
        };
      } else {
        console.warn(`Product ${productName} not found in ${productType} catalog`);
        return null;
      }
    }).filter(rec => rec !== null);
    
    return validatedRecommendations;
  } catch (error) {
    console.error("Error generating AI product recommendations:", error);
    // Fallback to rule-based system
    return generateFallbackProductRecommendations(cropRecommendations, availableProducts);
  }
};

// Intelligent quantity calculation based on land area
const calculateIntelligentQuantity = (productType, landArea, cropType, soilConditions) => {
  const baseRates = {
    seed: 25, // kg per hectare
    fertilizer: 100, // kg per hectare
    pesticide: 2, // liters per hectare
    tool: 1 // pieces (not area dependent)
  };

  // Convert land area from square feet to hectares
  // 1 hectare = 10,764 square feet
  const landAreaInHectares = landArea / 10764;
  
  let quantity = baseRates[productType] * landAreaInHectares;

  // Adjust based on crop type
  const cropMultipliers = {
    "Rice": { seed: 1.2, fertilizer: 1.5, pesticide: 1.1 },
    "Wheat": { seed: 1.0, fertilizer: 1.3, pesticide: 0.9 },
    "Cotton": { seed: 0.8, fertilizer: 1.8, pesticide: 1.5 },
    "Maize": { seed: 1.1, fertilizer: 1.4, pesticide: 1.2 },
    "Soybean": { seed: 0.9, fertilizer: 1.2, pesticide: 0.8 }
  };

  if (cropMultipliers[cropType] && cropMultipliers[cropType][productType]) {
    quantity *= cropMultipliers[cropType][productType];
  }

  // Adjust based on soil conditions
  if (soilConditions.ndvi < 0.3) {
    quantity *= 1.3; // More fertilizer for poor soil
  }

  return Math.ceil(quantity);
};

// Enhanced agentic recommendation system - returns format compatible with automated ordering
const generateTrulyAgenticRecommendations = async (userId) => {
  try {
    console.log(`Generating truly agentic recommendations for user ${userId}...`);

    // Step 1: Analyze land and soil conditions
    const landAnalysis = await analyzeLandConditions(userId);
    
    // Step 2: Fetch available products from merchant
    const products = await fetchProductsFromMerchant();
    const availableCrops = products.seeds.map(s => s.name);
    
    // Step 3: Generate AI-powered crop recommendations
    const cropRecommendations = await generateAgenticCropRecommendations(landAnalysis, availableCrops);
    
    // Step 4: Generate AI-powered product recommendations (in automated ordering format)
    const productRecommendations = await generateAgenticProductRecommendations(
      cropRecommendations, 
      landAnalysis, 
      products
    );
    
    // Step 5: Generate comprehensive AI insights
    const aiPrompt = `Based on the following comprehensive agricultural analysis, provide detailed farming recommendations:

LAND ANALYSIS: ${JSON.stringify(landAnalysis, null, 2)}
CROP RECOMMENDATIONS: ${JSON.stringify(cropRecommendations, null, 2)}
PRODUCT RECOMMENDATIONS: ${JSON.stringify(productRecommendations, null, 2)}

Provide detailed recommendations for:
1. Optimal planting schedule and timing
2. Soil preparation and amendment strategies
3. Irrigation and water management plan
4. Integrated pest management approach
5. Fertilization schedule and application methods
6. Expected yields and profitability analysis
7. Risk mitigation strategies
8. Seasonal planning and crop rotation

Format as a comprehensive farming plan with specific, actionable recommendations.`;

    const aiInsights = await gptRecommendation(aiPrompt);

    return {
      landAnalysis,
      cropRecommendations,
      productRecommendations, // This is now in the exact format for automated ordering
      aiInsights,
      isAgentic: true, // Flag to indicate this is truly agentic
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("Error in truly agentic recommendations:", error.message);
    throw error;
  }
};

// Fallback functions for when AI fails
const generateFallbackCropRecommendations = (landAnalysis) => {
  // Simple fallback - return top 3 crops based on basic conditions
  const crops = [
    { name: "Wheat Seeds", score: 75, reasons: ["Good for current conditions"], suitability: "High" },
    { name: "Maize Seeds", score: 70, reasons: ["Suitable temperature range"], suitability: "High" },
    { name: "Soybean Seeds", score: 65, reasons: ["Moderate conditions"], suitability: "Medium" }
  ];
  return crops;
};

const generateFallbackProductRecommendations = (cropRecommendations, availableProducts) => {
  // Simple fallback - return basic recommendations
  const recommendations = [];
  
  // Add seeds for top crop
  if (cropRecommendations.length > 0) {
    const topCrop = cropRecommendations[0];
    const seedProduct = availableProducts.seeds.find(s => s.name === topCrop.name);
    if (seedProduct) {
      recommendations.push({
        type: "seed",
        product: seedProduct,
        quantity: 5,
        priority: "high",
        reason: `Recommended crop: ${topCrop.name}`
      });
    }
  }
  
  // Add basic fertilizer
  const ureaProduct = availableProducts.fertilizers.find(f => f.name === "Urea");
  if (ureaProduct) {
    recommendations.push({
      type: "fertilizer",
      product: ureaProduct,
      quantity: 10,
      priority: "high",
      reason: "Essential nitrogen fertilizer"
    });
  }
  
  return recommendations;
};

module.exports = {
  generateTrulyAgenticRecommendations,
  generateAgenticCropRecommendations,
  generateAgenticProductRecommendations,
  calculateIntelligentQuantity,
  fetchProductsFromMerchant,
  analyzeLandConditions
};
