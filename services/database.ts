import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

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

// ─── Local Fallback Helpers ───────────────────────────────────────────────────

const getLocalInvoices = async (): Promise<Invoice[]> => {
  const data = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalInvoice = async (invoice: Invoice): Promise<number> => {
  const existing = await getLocalInvoices();
  const newInvoice = { ...invoice, id: Date.now() };
  await AsyncStorage.setItem(
    ASYNC_STORAGE_KEY,
    JSON.stringify([newInvoice, ...existing])
  );
  return newInvoice.id as number;
};

// ─── No-op init (Supabase table is managed via Dashboard) ────────────────────

export const initDatabase = async () => {
  // No-op — table is created in the Supabase SQL editor
};

// ─── Save Invoice ─────────────────────────────────────────────────────────────

export const saveInvoice = async (invoice: Invoice): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          invoice_no: invoice.invoiceNo,
          date: invoice.date,
          time: invoice.time,
          vehicle_no: invoice.vehicleNo,
          lr_no: invoice.lrNo || '',
          client_gst: invoice.clientGst,
          client_name: invoice.clientName,
          client_address: invoice.clientAddress,
          client_state: invoice.clientState,
          client_state_code: invoice.clientStateCode,
          address_used: invoice.addressUsed,
          line_items: invoice.lineItems,
          subtotal: invoice.subtotal,
          cgst: invoice.cgst,
          sgst: invoice.sgst,
          igst: invoice.igst,
          grand_total: invoice.grandTotal,
          total_bags: invoice.totalBags,
          total_quantity: invoice.totalQuantity,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Invoice saved to Supabase, id:', data.id);
    return data.id;
  } catch (err) {
    console.warn('⚠️ Supabase save failed — saving locally as fallback:', err);
    return saveLocalInvoice(invoice);
  }
};

// ─── Get All Invoices ─────────────────────────────────────────────────────────

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row: any) => ({
      id: row.id,
      invoiceNo: row.invoice_no,
      date: row.date,
      time: row.time,
      vehicleNo: row.vehicle_no,
      lrNo: row.lr_no,
      clientGst: row.client_gst,
      clientName: row.client_name,
      clientAddress: row.client_address,
      clientState: row.client_state,
      clientStateCode: row.client_state_code,
      addressUsed: row.address_used,
      lineItems: row.line_items,
      subtotal: row.subtotal,
      cgst: row.cgst,
      sgst: row.sgst,
      igst: row.igst,
      grandTotal: row.grand_total,
      totalBags: row.total_bags,
      totalQuantity: row.total_quantity,
    }));
  } catch (err) {
    console.warn('⚠️ Supabase fetch failed — loading locally as fallback:', err);
    return getLocalInvoices();
  }
};

// ─── Get Last Invoice Number ──────────────────────────────────────────────────

export const getLastInvoiceNo = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_no')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data.invoice_no;
  } catch {
    const invoices = await getLocalInvoices();
    return invoices.length > 0 ? invoices[0].invoiceNo : null;
  }
};
