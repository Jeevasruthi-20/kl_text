/**
 * GSTIN Lookup Service
 * 
 * Primary: gstincheck.co.in (Paid API key provided by user)
 * Backups: Multiple CORS proxies as failover
 */

export interface GstDetails {
  companyName: string;
  tradeName: string;
  address: string;
  state: string;
  stateCode: string;
  status: string;
}

export type LookupResult =
  | { success: true; data: GstDetails }
  | { success: false; error: 'invalid_format' | 'not_found' | 'network_error' | 'api_error' };

const STATE_MAP: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh',
  '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar',
  '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar',
  '36': 'Telangana', '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const API_KEY = '686fda88a8151d5c016d7c11ce9eb238';

/**
 * Main Lookup Function
 */
export const lookupGST = async (gstin: string): Promise<LookupResult> => {
  const cleaned = gstin.trim().toUpperCase();

  if (!GSTIN_REGEX.test(cleaned)) {
    return { success: false, error: 'invalid_format' };
  }

  const stateCode = cleaned.substring(0, 2);

  // Attempt 1: Direct Call to gstincheck.co.in (The new API key service)
  try {
    console.log("GST Lookup: Trying gstincheck.co.in...");
    const res = await fetch(`https://sheet.gstincheck.co.in/check/${API_KEY}/${cleaned}`, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.flag && json.data) {
        const d = json.data;
        return {
          success: true,
          data: {
            companyName: d.lgnm || d.tradeNam || '',
            tradeName: d.tradeNam || d.lgnm || '',
            address: d.pradr?.adr || '',
            state: d.pradr?.addr?.stcd || STATE_MAP[stateCode] || '',
            stateCode: stateCode,
            status: d.sts || 'Active'
          }
        };
      } else if (json.flag === false) {
        return { success: false, error: 'not_found' };
      }
    }
  } catch (e) {
    console.warn("GST Lookup: Primary API failed, falling back to proxies...", e);
  }

  // Attempt 2: Fallback to old proxy-based routes
  const routes = [
    { name: 'allorigins', url: `https://api.allorigins.win/get?url=${encodeURIComponent(`https://gstin.in/api/search?gstin=${cleaned}`)}` },
    { name: 'corsproxy', url: `https://corsproxy.io/?${encodeURIComponent(`https://gstin.in/api/search?gstin=${cleaned}`)}` }
  ];

  for (const route of routes) {
    try {
      console.log(`GST Lookup: trying fallback ${route.name}...`);
      const res = await fetch(route.url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;

      const raw = await res.json();
      const body = route.name === 'allorigins' ? JSON.parse(raw.contents) : raw;

      if (body && !body.error && !body.errorCode) {
        const addr = body.pradr?.addr || {};
        const parts = [addr.bnm, addr.bno, addr.flno, addr.st, addr.loc, addr.city, addr.dst, addr.stcd, addr.pncd].filter(Boolean);
        
        return {
          success: true,
          data: {
            companyName: body.lgnm || body.tradeNam || '',
            tradeName: body.tradeNam || body.lgnm || '',
            address: parts.join(', '),
            state: STATE_MAP[stateCode] || addr.stcd || '',
            stateCode,
            status: body.sts || 'Active'
          }
        };
      }
    } catch (err) {
      console.warn(`GST Lookup: fallback ${route.name} failed —`, err);
    }
  }

  return { success: false, error: 'network_error' };
};

export const getOfflineGstData = (gstin: string): Partial<GstDetails> => {
  const stateCode = gstin.substring(0, 2);
  return {
    state: STATE_MAP[stateCode] || '',
    stateCode: stateCode,
  };
};

export const getGstErrorMessage = (
  error: 'invalid_format' | 'not_found' | 'network_error' | 'api_error'
): string => {
  switch (error) {
    case 'invalid_format':
      return 'Invalid GSTIN format (15 chars needed)\nGSTIN தவறான வடிவம் (15 எழுத்துகள் வேண்டும்)';
    case 'not_found':
      return 'GSTIN not found — please fill manually\nGSTIN கிடைக்கவில்லை — கைமுறையாக நிரப்பவும்';
    case 'network_error':
      return 'Network error — please fill manually\nநெட்வொர்க் பிழை — கைமுறையாக நிரப்பவும்';
    case 'api_error':
      return 'Service unavailable — please fill manually\nசேவை இல்லை — கைமுறையாக நிரப்பவும்';
    default:
      return 'Unknown error / அறியப்படாத பிழை';
  }
};