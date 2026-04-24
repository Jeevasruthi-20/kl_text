import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Invoice } from './database';
import { COMPANY_DETAILS } from '../constants/Company';

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

export function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  function convert(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + (ones[num % 10] ? ones[num % 10] + ' ' : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + convert(num % 100);
    if (num < 100000) return convert(Math.floor(num / 1000)) + 'Thousand ' + convert(num % 1000);
    if (num < 10000000) return convert(Math.floor(num / 100000)) + 'Lakh ' + convert(num % 100000);
    return convert(Math.floor(num / 10000000)) + 'Crore ' + convert(num % 10000000);
  }
  return 'Rupees: ' + convert(n).trim() + ' Only';
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const generateInvoicePDF = async (invoice: Invoice): Promise<void> => {
  try {
    const primaryAddress = invoice.addressUsed || COMPANY_DETAILS.addresses[0] || '';
    const additionalAddress = COMPANY_DETAILS.addresses.find((addr) => addr !== primaryAddress) || '';
    const companyName = COMPANY_DETAILS.name.toUpperCase();
    const phoneText = COMPANY_DETAILS.phones.join(' / ');

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 20px; font-size: 11px; }
          .container { border: 1px solid #000; padding: 0; }
          
          /* Header Section */
          .header-table { width: 100%; border-bottom: 1px solid #000; border-collapse: collapse; }
          .header-table td { padding: 8px; vertical-align: top; border: 1px solid #000; }
          .logo-cell { width: 100px; text-align: center; }
          .company-cell { text-align: center; }
          .meta-cell { width: 180px; }
          
          .company-name { font-size: 18px; font-weight: bold; color: #d32f2f; margin: 0; }
          .company-details { font-size: 10px; line-height: 1.3; margin-top: 4px; }
          
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .meta-label { font-weight: bold; width: 80px; }
          
          .tax-invoice-banner { background-color: #eee; text-align: center; font-weight: bold; padding: 4px; border-bottom: 1px solid #000; font-size: 12px; }
          
          /* Address Section */
          .address-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
          .address-table td { width: 50%; padding: 8px; vertical-align: top; border: 1px solid #000; }
          .address-title { font-weight: bold; margin-bottom: 4px; color: #004aad; }
          
          /* Items Table */
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th { border: 1px solid #000; padding: 6px; font-size: 10px; background-color: #f9f9f9; }
          .items-table td { border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; text-align: center; }
          .items-table .text-left { text-align: left; }
          .items-table .text-right { text-align: right; }
          .items-table tr.last-row td { border-bottom: 1px solid #000; padding-top: 40px; } /* Empty space for table height */
          .items-table tr.total-row td { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; background-color: #f9f9f9; }
          
          /* Summary Section */
          .summary-table { width: 100%; border-collapse: collapse; }
          .summary-table td { border: 1px solid #000; vertical-align: top; padding: 8px; }
          .words-cell { width: 55%; }
          .tax-cell { width: 45%; padding: 0; }
          
          .tax-breakdown-table { width: 100%; border-collapse: collapse; }
          .tax-breakdown-table td { border: none; border-bottom: 1px solid #000; padding: 4px 8px; }
          .tax-breakdown-table tr:last-child td { border-bottom: none; }
          .tax-label { font-weight: bold; }
          .tax-val { text-align: right; font-weight: bold; }
          
          .bank-details-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          .bank-details-table td { border: none; padding: 2px 0; font-size: 10px; }
          
          /* Signature Section */
          .footer-table { width: 100%; border-collapse: collapse; }
          .footer-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
          .declaration-cell { width: 55%; font-size: 9px; line-height: 1.3; }
          .signature-cell { width: 45%; text-align: center; padding-top: 10px; }
          
          .signature-company { font-weight: bold; color: #d32f2f; margin-bottom: 40px; }
          .signature-role { font-weight: bold; }
        </style>
      </head>
      <body>
        <div style="text-align: right; font-size: 10px; margin-bottom: 4px;">(Duplicate)</div>
        <div class="container">
          <table class="header-table">
            <tr>
              <td class="logo-cell">
                <!-- Placeholder for logo as seen in sample -->
                <div style="width: 80px; height: 80px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; color: #ddd;">LOGO</div>
              </td>
              <td class="company-cell">
                <p class="company-name">${escapeHtml(companyName)}</p>
                <div class="company-details">
                  ${escapeHtml(primaryAddress)}<br/>
                  ${additionalAddress ? `${escapeHtml(additionalAddress)}<br/>` : ''}
                  Email: kltextiles@gmail.com<br/>
                  CELL: ${escapeHtml(phoneText)}<br/>
                  <strong>GSTIN : ${escapeHtml(COMPANY_DETAILS.gst)}</strong>
                </div>
              </td>
              <td class="meta-cell">
                <div class="meta-row"><span class="meta-label">Bill No</span><span>: ${invoice.invoiceNo}</span></div>
                <div class="meta-row"><span class="meta-label">Date</span><span>: ${invoice.date}</span></div>
                <div class="meta-row"><span class="meta-label">VEHICLE NO</span><span>: ${invoice.vehicleNo || '-'}</span></div>
                <div class="meta-row"><span class="meta-label">Eway Bill No</span><span>: ${invoice.lrNo || '-'}</span></div>
              </td>
            </tr>
          </table>

          <div class="tax-invoice-banner">TAX INVOICE</div>

          <table class="address-table">
            <tr>
              <td style="width: 100%;">
                <div class="address-title">Billing & Shipping Address</div>
                <strong>To, ${invoice.clientName}</strong><br/>
                ${invoice.clientAddress}<br/><br/>
                <strong>GSTIN : ${invoice.clientGst}</strong>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px;">S.No</th>
                <th>Description of Goods</th>
                <th style="width: 70px;">HSN Code</th>
                <th style="width: 40px;">No of Bags</th>
                <th style="width: 70px;">Qty in Kgs</th>
                <th style="width: 60px;">Rate</th>
                <th style="width: 90px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.lineItems.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="text-left">${item.description}</td>
                  <td>${item.hsn}</td>
                  <td>${item.bags}</td>
                  <td>${item.quantity.toFixed(3)}</td>
                  <td>${item.rate.toFixed(2)}</td>
                  <td class="text-right">${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="last-row">
                <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              </tr>
              <tr class="total-row">
                <td colspan="2">E.&O.E</td>
                <td class="text-right">Total</td>
                <td>${invoice.totalBags}</td>
                <td>${invoice.totalQuantity.toFixed(3)}</td>
                <td></td>
                <td class="text-right">${invoice.subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td class="words-cell">
                <strong><u>Rupees in Words</u></strong><br/>
                <div style="margin-top: 8px; font-weight: bold; text-transform: uppercase;">
                  ${numberToWords(invoice.grandTotal).replace('Rupees: ', '').replace(' Only', '')} ONLY
                </div>
                
                <div style="margin-top: 20px;">
                  <strong><u>Bank Details:</u></strong><br/>
                  <table class="bank-details-table">
                    <tr><td style="width: 60px;">Bank</td><td>: <strong>${escapeHtml(COMPANY_DETAILS.bank.name.toUpperCase())}</strong></td></tr>
                    <tr><td>A/C NO</td><td>: <strong>${escapeHtml(COMPANY_DETAILS.bank.accountNo)}</strong></td></tr>
                    <tr><td>Branch</td><td>: <strong>${escapeHtml(COMPANY_DETAILS.bank.branch.toUpperCase())}</strong></td></tr>
                    <tr><td>IFSC CODE</td><td>: <strong>${escapeHtml(COMPANY_DETAILS.bank.ifsc.toUpperCase())}</strong></td></tr>
                  </table>
                </div>
              </td>
              <td class="tax-cell">
                <table class="tax-breakdown-table">
                  <tr>
                    <td class="tax-label">CGST</td>
                    <td style="width: 60px;">2.5 %</td>
                    <td class="tax-val">${invoice.cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td class="tax-label">SGST</td>
                    <td>2.5 %</td>
                    <td class="tax-val">${invoice.sgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td class="tax-label">IGST</td>
                    <td>0 %</td>
                    <td class="tax-val">0.00</td>
                  </tr>
                  <tr>
                    <td class="tax-label" colspan="2">Net Amount</td>
                    <td class="tax-val">${(invoice.subtotal + invoice.cgst + invoice.sgst).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td class="tax-label" colspan="2">Round Off</td>
                    <td class="tax-val">${(invoice.grandTotal - (invoice.subtotal + invoice.cgst + invoice.sgst)).toFixed(2)}</td>
                  </tr>
                  <tr style="background-color: #eee;">
                    <td class="tax-label" colspan="2" style="font-size: 12px;">Total Amount after Tax</td>
                    <td class="tax-val" style="font-size: 13px;">${invoice.grandTotal.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <table class="footer-table">
            <tr>
              <td class="declaration-cell">
                <strong>Declaration:</strong> We Declare that this Invoice shows the actual price of the goods and that all particulars are true and correct.<br/>
                * 12% Interest will be Charged after 15 days payment.
              </td>
              <td class="signature-cell">
                <div class="signature-company">For ${escapeHtml(companyName)}</div>
                <div style="height: 40px;"></div> <!-- Signature space -->
                <div class="signature-role">Authorised Signatory</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ 
      html: invoiceHTML,
      base64: false 
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Invoice ${invoice.invoiceNo} - ${COMPANY_DETAILS.name}`,
      UTI: 'com.adobe.pdf',
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};
