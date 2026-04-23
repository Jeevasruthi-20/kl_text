import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Invoice, LineItem } from './database';
import { COMPANY_DETAILS } from '../constants/Company';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

const numberToWords = (num: number) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: any): string {
    if (n == 0) return 'Zero ';
    let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_arr) return ''; 
    let str = '';
    str += (Number(n_arr[1]) != 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
    str += (Number(n_arr[2]) != 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
    str += (Number(n_arr[3]) != 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
    str += (Number(n_arr[4]) != 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
    str += (Number(n_arr[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) + 'Rupees ' : '';
    return str;
  }
  
  const rounded = Math.round(num);
  return inWords(rounded) + 'Only';
};

export const generateInvoicePDF = async (invoice: Invoice) => {
  const originalTotal = invoice.subtotal + invoice.cgst + invoice.sgst;
  const roundedTotal = Math.round(originalTotal);
  const amountInWords = numberToWords(roundedTotal);
  
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; font-size: 11px; line-height: 1.4; }
          .header-table { width: 100%; border-bottom: 2px solid #004aad; padding-bottom: 15px; margin-bottom: 15px; }
          .logo-box { width: 70px; height: 70px; border: 2px solid #004aad; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #004aad; font-size: 20px; }
          .company-name { font-size: 36px; font-weight: bold; color: #004aad; margin: 0; text-transform: uppercase; }
          .company-details { margin: 2px 0; font-size: 10px; color: #555; }
          .invoice-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; background-color: #f8f9fa; padding: 8px; border: 1px solid #ddd; text-transform: uppercase; }
          .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-box { width: 48%; }
          .info-label { font-weight: bold; color: #004aad; margin-bottom: 5px; display: block; border-bottom: 1px solid #eee; }
          table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          table.items th { background-color: #004aad; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #004aad; }
          table.items td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 10px; }
          .summary-section { display: flex; justify-content: space-between; margin-top: 20px; align-items: flex-start; }
          .words-container { width: 55%; border: 1px solid #eee; padding: 10px; background-color: #fafafa; }
          .totals-container { width: 40%; }
          .totals-table { width: 100%; border-collapse: collapse; }
          .totals-table td { padding: 4px 8px; }
          .totals-table .label { text-align: left; font-weight: bold; }
          .totals-table .val { text-align: right; }
          .grand-total-row { background-color: #f8f9fa; font-size: 13px; border-top: 2px solid #004aad; border-bottom: 2px solid #004aad; }
          .bank-section { margin-top: 20px; padding: 12px; border: 1px solid #eee; background-color: #fafafa; font-size: 10px; }
          .footer-signs { margin-top: 60px; display: flex; justify-content: space-between; }
          .signatory-box { width: 200px; text-align: center; border-top: 1px solid #333; padding-top: 8px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 80px;">
              <div class="logo-box">KLT</div>
            </td>
            <td>
              <h1 class="company-name">${COMPANY_DETAILS.name}</h1>
              <p class="company-details"><strong>GSTIN: ${COMPANY_DETAILS.gst}</strong> | <strong>Cell: ${COMPANY_DETAILS.phones.join(' / ')}</strong></p>
              <p class="company-details">${invoice.addressUsed}</p>
            </td>
          </tr>
        </table>

        <div class="invoice-title">Job Work Invoice</div>

        <div class="info-grid">
          <div class="info-box">
            <span class="info-label">BILL TO:</span>
            <strong>${invoice.clientName}</strong><br/>
            ${invoice.clientAddress}<br/>
            <strong>GSTIN: ${invoice.clientGst}</strong><br/>
            State: ${invoice.clientState} (Code: ${invoice.clientStateCode})
          </div>
          <div class="info-box" style="text-align: right;">
            <span class="info-label">INVOICE DETAILS:</span>
            <strong>Invoice No: ${invoice.invoiceNo}</strong><br/>
            Date: ${invoice.date}<br/>
            Time: ${invoice.time}<br/>
            Vehicle No: ${invoice.vehicleNo || 'Self'}<br/>
            L.R. No: ${invoice.lrNo || '-'}
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th style="width: 40px;">S.No</th>
              <th>Description</th>
              <th>HSN Code</th>
              <th>No.Bags</th>
              <th>Qty(kg)</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.lineItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td style="text-align: left;">${item.description}</td>
                <td>${item.hsn}</td>
                <td>${item.bags}</td>
                <td>${item.quantity.toFixed(2)}</td>
                <td>${item.rate.toFixed(2)}</td>
                <td style="text-align: right;">${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="words-container">
            <strong>Amount in Words:</strong><br/>
            Rupees: ${amountInWords}<br/><br/>
            <div class="bank-section" style="margin-top: 10px; padding: 0; background: none; border: none;">
              <strong>Bank Details:</strong><br/>
              Bank: ${COMPANY_DETAILS.bank.name}<br/>
              A/c No: ${COMPANY_DETAILS.bank.accountNo}<br/>
              IFSC: ${COMPANY_DETAILS.bank.ifsc} | Branch: ${COMPANY_DETAILS.bank.branch}
            </div>
          </div>
          <div class="totals-container">
            <table class="totals-table">
              <tr>
                <td class="label">Total Bags:</td>
                <td class="val">${invoice.totalBags}</td>
              </tr>
              <tr>
                <td class="label">Total Qty (kg):</td>
                <td class="val">${invoice.totalQuantity.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">Subtotal:</td>
                <td class="val">${invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">SGST (2.5%):</td>
                <td class="val">${invoice.sgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">CGST (2.5%):</td>
                <td class="val">${invoice.cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">Rounding:</td>
                <td class="val">${(invoice.grandTotal - (invoice.subtotal + invoice.cgst + invoice.sgst)).toFixed(2)}</td>
              </tr>
              <tr class="grand-total-row">
                <td class="label">TOTAL AMOUNT:</td>
                <td class="val"><strong>₹ ${invoice.grandTotal}</strong></td>
              </tr>
            </table>
          </div>
        </div>

        <div class="footer-signs">
          <div class="signatory-box">Receiver's Signature</div>
          <div class="signatory-box">
            For <strong>${COMPANY_DETAILS.name}</strong><br/><br/><br/>
            Authorized Signatory
          </div>
        </div>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    // On Web, this directly opens the print dialog with ONLY the formal HTML
    await Print.printAsync({ html });
  } else {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  }
};
