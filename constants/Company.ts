export const COMPANY_DETAILS = {
  name: "K.L. Textiles",
  gst: "33AMDPM0134C1ZV",
  phones: ["9443840407", "7010840177"],
  addresses: [
    "66/1 Dharapuram Road, Mulanur-638106, Dharapuram(T.K) Tirupur(D.T)",
    "Door No:84, Thannerpanthal, Vellakovil-638111, Kangeyam(T.K) Tirupur(D.T)"
  ],
  bank: {
    name: "Bank of Baroda",
    accountNo: "56770400000019",
    ifsc: "BARBODHATIR",
    branch: "Dharapuram"
  }
};

export const LINE_ITEM_DEFAULTS = [
  { label: "Job Work Charges", hsn: "9988", rate: 12.50 },
  { label: "Yarn Charges", hsn: "52061200", rate: 0 } // Rate to be entered
];
export const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
  "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh"
};
