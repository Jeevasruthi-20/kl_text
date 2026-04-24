import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Invoice } from './database';

/**
 * Generates a CSV file from the list of invoices and opens the share dialog.
 */
export const exportInvoicesToCSV = async (invoices: Invoice[]) => {
  if (invoices.length === 0) return;

  // Header row
  let csv = 'ID,InvoiceNo,Date,Time,ClientName,ClientGST,Subtotal,CGST,SGST,GrandTotal,Bags,Quantity\n';

  // Data rows
  invoices.forEach(inv => {
    csv += `${inv.id},"${inv.invoiceNo}","${inv.date}","${inv.time}","${inv.clientName}","${inv.clientGst}",${inv.subtotal},${inv.cgst},${inv.sgst},${inv.grandTotal},${inv.totalBags},${inv.totalQuantity}\n`;
  });

  const fileName = `KL_Textiles_Invoices_Backup_${new Date().toISOString().split('T')[0]}.csv`;
  const fileUri = FileSystem.cacheDirectory + fileName;

  try {
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Backup Invoices (5-Year Storage)',
      UTI: 'public.comma-separated-values-text',
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
  }
};
