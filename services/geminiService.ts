
import { GoogleGenAI } from "@google/genai";
import { Vehicle } from "../types";

const getAI = () => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please ensure GEMINI_API_KEY is set in your environment variables.");
  }
  console.log("Gemini Service using API Key starting with:", apiKey.substring(0, 6) + "...");
  return new GoogleGenAI({ apiKey });
};

const generate = async (prompt: string, config: any = {}) => {
  try {
    const ai = getAI();
    // Use the recommended model for complex tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      ...config,
    });
    
    if (!response.text) {
      throw new Error("Empty response from Gemini API");
    }
    
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    throw error;
  }
};

export const getVehicleInsights = async (vehicle: Vehicle) => {
  const prompt = `
As an expert EV technician, provide 3 highly specific maintenance or optimization tips for this vehicle:

Make: ${vehicle.make}
Model: ${vehicle.model}
Year: ${vehicle.year}
Range: ${vehicle.currentRange} km
Home Charger: ${vehicle.homeChargerRating} kWh
Charger Type: ${vehicle.chargerType}
Battery Capacity: ${vehicle.batteryCapacity} kWh
Efficiency: ${vehicle.efficiency} Wh/km
Usable SOC Range: ${vehicle.usableSOCMin}% - ${vehicle.usableSOCMax}%

Tips must be specific to the ${vehicle.make} ${vehicle.model}. 
Focus on battery health, software updates, or model-specific features.
Return concise markdown bullet points.
`;

  try {
    return await generate(prompt);
  } catch (error) {
    return "Unable to fetch AI insights at the moment. Please check your API configuration.";
  }
};

export const findNearbyChargersAI = async (location: string) => {
  const prompt = `List 3 EV charging stations near ${location} with their speeds (e.g., 150kW) and status. Format as a clean markdown list with bold names.`;

  try {
    return await generate(prompt, {
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
  } catch (error) {
    return "Charger search is currently unavailable. Please check your API configuration.";
  }
};
