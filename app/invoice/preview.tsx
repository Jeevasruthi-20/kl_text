import React from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  StyleSheet, Alert, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, ChevronLeft, Printer } from 'lucide-react-native';
import { saveInvoice } from '../../services/database';
import { generateInvoicePDF } from '../../services/pdfGenerator';
import { numberToWords } from '../../services/pdfGenerator'; // Re-using word converter

export default function InvoicePreview() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Inject print styles for web
  if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        header, footer, nav, [data-testid="footer-actions"] { 
          display: none !important; 
          visibility: hidden !important;
        }
        @page { margin: 0; }
        body { margin: 0; padding: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Guard for missing data
  if (!params.lineItems) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No invoice data found / தரவு இல்லை</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Parse complex params
  const lineItems = JSON.parse(params.lineItems as string);
  const subtotal = parseFloat(params.subtotal as string);
  const cgst = parseFloat(params.cgst as string);
  const sgst = parseFloat(params.sgst as string);
  const grandTotal = parseInt(params.grandTotal as string);
  const totalBags = parseInt(params.totalBags as string);
  const totalQuantity = parseFloat(params.totalQuantity as string);
  const isReprint = params.isReprint === 'true';

  const buildInvoice = () => ({
    ...params,
    lineItems,
    subtotal,
    cgst,
    sgst,
    grandTotal,
    totalBags,
    totalQuantity,
    invoiceNo: params.invoiceNo as string,
    date: params.date as string,
    time: params.time as string,
    vehicleNo: params.vehicleNo as string,
    lrNo: params.lrNo as string,
    clientGst: params.clientGst as string,
    clientName: params.clientName as string,
    clientAddress: params.clientAddress as string,
    clientState: params.clientState as string,
    clientStateCode: params.clientStateCode as string,
    addressUsed: params.addressUsed as string,
  });

  const handleSaveAndPrint = async () => {
    const invoice = buildInvoice();

    if (!invoice.clientName || !invoice.clientGst || lineItems.some((i: any) => i.quantity <= 0)) {
      if (Platform.OS === 'web') {
        alert("Missing Info / தகவல் விடுபட்டுள்ளது: Please fill all required fields and ensure quantities are greater than zero.");
      } else {
        Alert.alert("Missing Info / தகவல் விடுபட்டுள்ளது", "Please fill all required fields and ensure quantities are greater than zero.");
      }
      return;
    }

    try {
      if (!isReprint) {
        await saveInvoice(invoice as any);
      }
      await generateInvoicePDF(invoice as any);
      router.push('/invoice/history');
    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF.");
    }
  };

  const handleWebPrint = () => {
    if (Platform.OS === 'web') {
      window.print();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f3f5' }}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.previewCard}>
            {/* Header */}
            <View style={styles.previewHeader}>
              <Text style={styles.previewCompanyName}>K.L. TEXTILES</Text>
              <Text style={styles.previewCompanyAddr}>{params.addressUsed}</Text>
              <Text style={styles.previewCompanyMeta}>GST: 33AMDPM0134C1ZV  |  Ph: 9443840407</Text>
            </View>

            <View style={styles.previewBanner}>
              <Text style={styles.previewBannerText}>JOB WORK INVOICE</Text>
            </View>

            <View style={styles.previewMetaRow}>
              <View style={styles.previewMetaCol}>
                <Text style={styles.previewMetaText}>Bill No: <Text style={{ fontWeight: 'bold' }}>{params.invoiceNo}</Text></Text>
                <Text style={styles.previewMetaText}>Date: {params.date}</Text>
                <Text style={styles.previewMetaText}>Time: {params.time}</Text>
              </View>
              <View style={[styles.previewMetaCol, { borderLeftWidth: 1, borderColor: '#000' }]}>
                <Text style={styles.previewMetaText}>Vehicle: {params.vehicleNo || '-'}</Text>
                <Text style={styles.previewMetaText}>L.R. No: {params.lrNo || '-'}</Text>
              </View>
            </View>

            <View style={styles.previewAddrGrid}>
              <View style={styles.previewAddrBox}>
                <Text style={styles.previewAddrTitle}>BILL TO / SHIP TO:</Text>
                <Text style={styles.previewAddrName}>{params.clientName || '---'}</Text>
                <Text style={styles.previewAddrText} numberOfLines={2}>{params.clientAddress || '---'}</Text>
                <Text style={styles.previewAddrText}>State: {params.clientState} ({params.clientStateCode})</Text>
                <Text style={styles.previewAddrText}>GSTIN: {params.clientGst || '---'}</Text>
              </View>
            </View>

            {/* TABLE PREVIEW - 7 COLUMNS */}
            <View style={styles.previewTableHead}>
              <Text style={[styles.pCol, { flex: 0.4 }]}>S.No</Text>
              <Text style={[styles.pCol, { flex: 2.5, textAlign: 'left' }]}>Description</Text>
              <Text style={[styles.pCol, { flex: 1 }]}>HSN Code</Text>
              <Text style={[styles.pCol, { flex: 0.8 }]}>Bags</Text>
              <Text style={[styles.pCol, { flex: 1 }]}>Qty(kg)</Text>
              <Text style={[styles.pCol, { flex: 0.8 }]}>Rate</Text>
              <Text style={[styles.pCol, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
            </View>
            {lineItems.map((item: any, i: number) => (
              <View key={i} style={[styles.previewTableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9' }]}>
                <Text style={[styles.pCell, { flex: 0.4 }]}>{i + 1}</Text>
                <Text style={[styles.pCell, { flex: 2.5, textAlign: 'left' }]}>{item.description}</Text>
                <Text style={[styles.pCell, { flex: 1 }]}>{item.hsn}</Text>
                <Text style={[styles.pCell, { flex: 0.8 }]}>{item.bags}</Text>
                <Text style={[styles.pCell, { flex: 1 }]}>{item.quantity.toFixed(3)}</Text>
                <Text style={[styles.pCell, { flex: 0.8 }]}>{item.rate.toFixed(2)}</Text>
                <Text style={[styles.pCell, { flex: 1.2, textAlign: 'right' }]}>{item.amount.toFixed(2)}</Text>
              </View>
            ))}

            {/* TOTALS ROW */}
            <View style={styles.previewTotalsRow}>
              <Text style={[styles.pCell, { flex: 0.4 }]}></Text>
              <Text style={[styles.pCell, { flex: 2.5, fontWeight: 'bold', textAlign: 'left' }]}>E.&O.E  |  Total</Text>
              <Text style={[styles.pCell, { flex: 1 }]}></Text>
              <Text style={[styles.pCell, { flex: 0.8, fontWeight: 'bold' }]}>{totalBags}</Text>
              <Text style={[styles.pCell, { flex: 1, fontWeight: 'bold' }]}>{totalQuantity.toFixed(3)}</Text>
              <Text style={[styles.pCell, { flex: 0.8 }]}></Text>
              <Text style={[styles.pCell, { flex: 1.2, fontWeight: 'bold', textAlign: 'right' }]}>{subtotal.toFixed(2)}</Text>
            </View>

            {/* TAX SECTION ROW */}
            <View style={styles.taxSplitRow}>
              <View style={{ flex: 1 }} />
              <View style={styles.taxColumn}>
                <View style={styles.pTaxLine}>
                  <Text style={styles.pTaxLabel}>CGST 2.5%</Text>
                  <Text style={styles.pTaxVal}>{cgst.toFixed(2)}</Text>
                </View>
                <View style={styles.pTaxLine}>
                  <Text style={styles.pTaxLabel}>SGST 2.5%</Text>
                  <Text style={styles.pTaxVal}>{sgst.toFixed(2)}</Text>
                </View>
                <View style={styles.pTaxLine}>
                  <Text style={styles.pTaxLabel}>IGST 0%</Text>
                  <Text style={styles.pTaxVal}>0.00</Text>
                </View>
                <View style={styles.pTaxLine}>
                  <Text style={styles.pTaxLabel}>Net Amount</Text>
                  <Text style={styles.pTaxVal}>{(subtotal + cgst + sgst).toFixed(2)}</Text>
                </View>
                <View style={styles.pTaxLine}>
                  <Text style={styles.pTaxLabel}>Round Off</Text>
                  <Text style={styles.pTaxVal}>{(grandTotal - (subtotal + cgst + sgst)).toFixed(2)}</Text>
                </View>
                <View style={styles.pGrandRowHighlight}>
                  <Text style={styles.pGrandLabelText}>Total After Tax</Text>
                  <Text style={styles.pGrandValText}>₹ {grandTotal.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>

            {/* AMOUNT IN WORDS */}
            <View style={styles.amountWordsBox}>
              <Text style={styles.pInWordsText}>
                Rupees: {numberToWords(grandTotal).replace('Rupees: ', '').toUpperCase()}
              </Text>
            </View>

            {/* BANK + SIGNATURE ROW */}
            <View style={styles.pFooterRow}>
              <View style={styles.pBankCol}>
                <Text style={styles.pBankTitle}>Bank Details:</Text>
                <View style={styles.pBankDetailRow}><Text style={styles.pBankKey}>Bank</Text><Text>: Bank of Baroda</Text></View>
                <View style={styles.pBankDetailRow}><Text style={styles.pBankKey}>A/C No</Text><Text>: 56770400000019</Text></View>
                <View style={styles.pBankDetailRow}><Text style={styles.pBankKey}>IFSC</Text><Text>: BARB0DHATIR</Text></View>
                <View style={styles.pBankDetailRow}><Text style={styles.pBankKey}>Branch</Text><Text>: Dharapuram</Text></View>
              </View>
              <View style={styles.pSignCol}>
                <Text style={styles.pSignFor}>For K.L. TEXTILES</Text>
                <View style={{ height: 50 }} />
                <Text style={styles.pSignLabel}>Authorised Signatory</Text>
              </View>
            </View>

            {/* DECLARATION */}
            <View style={styles.pDeclarationBox}>
              <Text style={styles.pDeclarationText}>
                Declaration: We declare that this Invoice shows the actual price of goods and all particulars are true and correct. * 12% Interest charged after 15 days.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View testID="footer-actions" style={[styles.footer, styles.noPrint]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.webPrintBtn} onPress={handleWebPrint}>
            <Printer size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.printBtn} onPress={handleSaveAndPrint}>
          <Save size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noPrint: {
    // This will be handled by the CSS injection below
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 0,
    width: '100%',
    minHeight: '100%',
    borderWidth: 0,
  },
  previewHeader: { alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#000' },
  previewCompanyName: { fontSize: 24, fontWeight: 'bold', color: '#8B0000' },
  previewCompanyAddr: { fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 18, marginTop: 5 },
  previewCompanyMeta: { fontSize: 11, color: '#333', marginTop: 5, fontWeight: 'bold' },
  previewBanner: { backgroundColor: '#2a4a3e', padding: 8, borderBottomWidth: 1, borderColor: '#000' },
  previewBannerText: { color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: 'bold', letterSpacing: 3 },
  previewMetaRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  previewMetaCol: { flex: 1, padding: 10 },
  previewMetaText: { fontSize: 12, color: '#333', marginBottom: 3 },
  previewAddrGrid: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  previewAddrBox: { flex: 1, padding: 10 },
  previewAddrTitle: { fontSize: 12, fontWeight: 'bold', color: '#004aad', marginBottom: 5 },
  previewAddrName: { fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  previewAddrText: { fontSize: 12, color: '#555', lineHeight: 18 },
  previewTableHead: { flexDirection: 'row', backgroundColor: '#2a4a3e', borderBottomWidth: 1, borderColor: '#000' },
  pCol: { padding: 8, color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  previewTableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ddd' },
  pCell: { padding: 8, fontSize: 12, textAlign: 'center' },
  previewTotalsRow: { flexDirection: 'row', backgroundColor: '#e8f0ec', borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#000' },
  taxSplitRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  taxColumn: { width: 220, borderLeftWidth: 1, borderColor: '#000' },
  pTaxLine: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#ddd' 
  },
  pTaxLabel: { fontSize: 12, color: '#333', fontWeight: 'bold' },
  pTaxVal: { fontSize: 12, fontWeight: 'bold' },
  pGrandRowHighlight: { 
    backgroundColor: '#2a4a3e', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  pGrandLabelText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  pGrandValText: { color: '#90EE90', fontWeight: 'bold', fontSize: 16 },
  amountWordsBox: { backgroundColor: '#fffbea', padding: 12, borderBottomWidth: 1, borderTopWidth: 0.5, borderColor: '#ccc' },
  pInWordsText: { fontSize: 12, fontStyle: 'italic', fontWeight: 'bold', color: '#333' },
  pFooterRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  pBankCol: { flex: 1, padding: 12 },
  pBankTitle: { fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline', marginBottom: 8 },
  pBankDetailRow: { flexDirection: 'row', marginBottom: 3 },
  pBankKey: { fontSize: 12, fontWeight: 'bold', width: 60 },
  pSignCol: { width: 180, padding: 12, borderLeftWidth: 1, borderColor: '#000', alignItems: 'flex-end' },
  pSignFor: { fontSize: 12, fontWeight: 'bold', color: '#8B0000' },
  pSignLabel: { fontSize: 12, fontWeight: 'bold', paddingTop: 5, width: '100%', textAlign: 'right' },
  pDeclarationBox: { backgroundColor: '#f9f9f9', padding: 10, paddingHorizontal: 15 },
  pDeclarationText: { fontSize: 10, color: '#555', lineHeight: 16 },
  footer: {
    position: 'absolute',
    bottom: 30, 
    left: 0, 
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: 'transparent',
    gap: 30,
  },
  backBtn: {
    backgroundColor: '#7f8c8d',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  printBtn: {
    backgroundColor: '#004aad',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  webPrintBtn: {
    backgroundColor: '#2b8a3e',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
