import * as SQLite from 'expo-sqlite';

const dbName = 'invoices.db';

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
  const db = await SQLite.openDatabaseAsync(dbName);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNo TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      vehicleNo TEXT,
      lrNo TEXT,
      clientGst TEXT,
      clientName TEXT,
      clientAddress TEXT,
      clientState TEXT,
      clientStateCode TEXT,
      addressUsed TEXT,
      lineItems TEXT, -- JSON string
      subtotal REAL,
      cgst REAL,
      sgst REAL,
      igst REAL,
      grandTotal REAL,
      totalBags INTEGER,
      totalQuantity REAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const saveInvoice = async (invoice: Invoice) => {
  const db = await SQLite.openDatabaseAsync(dbName);
  const result = await db.runAsync(
    `INSERT INTO invoices (
      invoiceNo, date, time, vehicleNo, lrNo, 
      clientGst, clientName, clientAddress, clientState, clientStateCode, 
      addressUsed, lineItems, subtotal, cgst, sgst, igst, 
      grandTotal, totalBags, totalQuantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoice.invoiceNo, invoice.date, invoice.time, invoice.vehicleNo, invoice.lrNo || '',
      invoice.clientGst, invoice.clientName, invoice.clientAddress, invoice.clientState, invoice.clientStateCode,
      invoice.addressUsed, JSON.stringify(invoice.lineItems), invoice.subtotal, invoice.cgst, invoice.sgst, invoice.igst,
      invoice.grandTotal, invoice.totalBags, invoice.totalQuantity
    ]
  );
  return result.lastInsertRowId;
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const db = await SQLite.openDatabaseAsync(dbName);
  const rows = await db.getAllAsync('SELECT * FROM invoices ORDER BY id DESC');
  return rows.map((row: any) => ({
    ...row,
    lineItems: JSON.parse(row.lineItems)
  }));
};

export const getLastInvoiceNo = async (): Promise<string | null> => {
  const db = await SQLite.openDatabaseAsync(dbName);
  const row: any = await db.getFirstAsync('SELECT invoiceNo FROM invoices ORDER BY id DESC LIMIT 1');
  return row ? row.invoiceNo : null;
};
