const { gptRecommendation } = require("../utils/gptRecommendations");

async function gptRecommend(req, res) {
  try {
    console.log("Generating GPT recommendations...");
    
    // Simplified prompt without sensor data
    const promptToSend = `Please provide sustainable agricultural recommendations for a general farming scenario. Include suggestions for:
    1. Sustainable crops to grow
    2. Soil improvement practices
    3. Water management techniques
    4. Organic farming methods
    
    LIMIT response to 1500 characters.`;
    
    let suggestion;
    let sustainabilitySuggestion;
    
    try {
      sustainabilitySuggestion = `Improving soil quality is crucial for better plant growth, health, and productivity. Here are some sustainable steps you can consider:

1. Balancing Nutrients:
   - Conduct regular soil tests to monitor nutrient levels and adjust amendments accordingly.
   - Consider adding phosphorus and potassium-rich amendments like bone meal, rock phosphate, or greensand.

2. Organic Matter and Composting:
   - Incorporate well-rotted compost, aged manure, or other organic matter into the soil to improve its structure and nutrient content.
   - Composting kitchen and garden waste can provide a continuous source of organic matter.

3. Cover Cropping and Green Manures:
   - Grow cover crops like clover or vetch during off-seasons to prevent soil erosion, suppress weeds, and add organic matter when tilled into the soil.
   - Green manures, like legumes, can fix atmospheric nitrogen in the soil.

4. Crop Rotation:
   - Practice crop rotation to prevent soil nutrient depletion and to disrupt the life cycle of soil pests and diseases.

5. Mulching:
   - Apply a layer of organic mulch like straw or leaves on the soil surface to retain moisture, regulate temperature, and add organic matter as it decomposes.

6. Water Management:
   - Ensure proper drainage to prevent waterlogging, which can lead to root rot and other problems.
   - Maintain appropriate soil moisture levels for optimal plant growth.

7. Microbial Inoculants:
   - Consider adding microbial inoculants to enhance soil microbial activity, which helps in nutrient cycling and improving soil structure.

8. Reducing Soil Compaction:
   - Avoid over-tilling and heavy machinery that can lead to soil compaction.
   - Use appropriate tools to aerate the soil, improving root penetration and water infiltration.

9. Education and Monitoring:
   - Stay informed about sustainable soil management practices.
   - Monitor soil health over time by conducting regular soil tests.

10. Seeking Professional Advice:
    - Consider consulting with local agricultural extension services or soil scientists for personalized advice.`;
      
      suggestion = await gptRecommendation(promptToSend);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      suggestion = "Error fetching suggestions. Please try again later.";
    }
    
    res.status(200).json({ suggestion, sustainabilitySuggestion });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { gptRecommend };
