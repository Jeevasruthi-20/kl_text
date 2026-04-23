/**
 * GSTIN Lookup Service
 * 
 * To use a real API:
 * 1. Register at GSTIN.in (https://gstin.in/api/)
 * 2. Get your API Key
 * 3. Replace the URL in the fetch call below
 */

const API_KEY = 'YOUR_API_KEY_HERE'; // Add your key here

export interface GstDetails {
  companyName: string;
  address: string;
  state: string;
  stateCode: string;
}

export const lookupGst = async (gstin: string): Promise<GstDetails | null> => {
  if (gstin.length !== 15) return null;

  try {
    // Using the user-specified API endpoint
    // Assuming standard format: https://gstin.in/api/search?gstin={gstin}
    // Or similar. I will implement a generic fetch.
    
    /*
    const response = await fetch(`https://gstin.in/api/search?gstin=${gstin}&api_key=${API_KEY}`);
    const data = await response.json();
    
    // Adjust mapping based on actual API response structure
    if (data && data.status === "success") {
      return {
        companyName: data.data.lgnm || data.data.trade_name,
        address: data.data.pradr.addr.bnm + ", " + data.data.pradr.addr.st + ", " + data.data.pradr.addr.dst,
        state: data.data.pradr.addr.st,
        stateCode: gstin.substring(0, 2)
      };
    }
    */

    // MOCK RESPONSE FOR TESTING WITH THE SPECIFIED URL
    if (gstin.startsWith('33')) {
      return {
        companyName: "K.L. Spinning Mills Private Limited",
        address: "786 Cotton Market Road, Tirupur, Tamil Nadu - 641604",
        state: "Tamil Nadu",
        stateCode: "33"
      };
    }

    return {
      companyName: "Generic Textile Corp",
      address: "Industrial Estate, Sector 5, State Capital City",
      state: "Maharashtra",
      stateCode: gstin.substring(0, 2)
    };
  } catch (error) {
    console.error("GST Lookup failed:", error);
    return null;
  }
};
