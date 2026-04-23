import AsyncStorage from '@react-native-async-storage/async-storage';

const ASYNC_STORAGE_KEY = 'kl_textiles_invoices';

export interface LineItem {
  description: string;
  hsn: string;
  bags: number;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id?: number;
  invoiceNo: string;
  date: string;
  time: string;
  vehicleNo: string;
  lrNo?: string;
  clientGst: string;
  clientName: string;
  clientAddress: string;
  clientState: string;
  clientStateCode: string;
  addressUsed: string;
  lineItems: LineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  totalBags: number;
  totalQuantity: number;
}

export const initDatabase = async () => {
  // No-op for web
};

export const saveInvoice = async (invoice: Invoice) => {
  const existing = await getInvoices();
  const newInvoice = { ...invoice, id: Date.now() };
  await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify([newInvoice, ...existing]));
  return newInvoice.id;
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const data = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getLastInvoiceNo = async (): Promise<string | null> => {
  const invoices = await getInvoices();
  return invoices.length > 0 ? invoices[0].invoiceNo : null;
};
