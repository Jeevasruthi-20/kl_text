import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Plus, Trash2, Save, Printer, ArrowLeft } from 'lucide-react-native';
import { COMPANY_DETAILS, LINE_ITEM_DEFAULTS } from '../../constants/Company';
import { saveInvoice, getLastInvoiceNo, LineItem, Invoice } from '../../services/database';
import { generateInvoicePDF } from '../../services/pdfGenerator';
import { lookupGst } from '../../services/gstApi';

export default function NewInvoice() {
  const router = useRouter();
  
  // Header Fields
  const [invoiceNo, setInvoiceNo] = useState('JW-182');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [vehicleNo, setVehicleNo] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [addressUsed, setAddressUsed] = useState(COMPANY_DETAILS.addresses[0]);

  // Bill To Fields
  const [clientGst, setClientGst] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientState, setClientState] = useState('');
  const [clientStateCode, setClientStateCode] = useState('');

  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Job Work Charges', hsn: '9988', bags: 0, quantity: 0, rate: 12.50, amount: 0 }
  ]);

  useEffect(() => {
    async function loadLastNo() {
      const last = await getLastInvoiceNo();
      if (last) {
        const num = parseInt(last.replace('JW-', '')) + 1;
        setInvoiceNo(`JW-${num}`);
      }
    }
    loadLastNo();
  }, []);

  const handleGstLookup = async (gst: string) => {
    const formattedGst = gst.toUpperCase();
    setClientGst(formattedGst);
    
    if (formattedGst.length === 15) {
      const details = await lookupGst(formattedGst);
      if (details) {
        setClientName(details.companyName);
        setClientAddress(details.address);
        setClientState(details.state);
        setClientStateCode(details.stateCode);
      }
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    const item = { ...newItems[index] };

    if (field === 'bags') {
      const bags = parseFloat(value) || 0;
      item.bags = bags;
      item.quantity = bags * 75;
      item.amount = item.quantity * item.rate;
    } else if (field === 'quantity') {
      item.quantity = parseFloat(value) || 0;
      item.amount = item.quantity * item.rate;
    } else if (field === 'rate') {
      item.rate = parseFloat(value) || 0;
      item.amount = item.quantity * item.rate;
    } else if (field === 'description') {
      item.description = value;
      const def = LINE_ITEM_DEFAULTS.find(d => d.label === value);
      if (def) {
        item.hsn = def.hsn;
        if (def.rate > 0) item.rate = def.rate;
        item.amount = item.quantity * item.rate;
      }
    }

    newItems[index] = item;
    setLineItems(newItems);
  };

  const addRow = () => {
    setLineItems([...lineItems, { description: 'Job Work Charges', hsn: '9988', bags: 0, quantity: 0, rate: 12.50, amount: 0 }]);
  };

  const removeRow = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const totalBags = lineItems.reduce((sum, item) => sum + item.bags, 0);
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const igst = 0;
    const grandTotal = Math.round(subtotal + cgst + sgst + igst);

    return { totalBags, totalQuantity, subtotal, cgst, sgst, igst, grandTotal };
  };

  const handleSave = async () => {
    if (!clientName || !clientGst || lineItems.some(i => i.quantity === 0)) {
      Alert.alert("Missing Info", "Please fill all required fields and add items.");
      return;
    }

    const totals = calculateTotals();
    const invoice: Invoice = {
      invoiceNo, date, time, vehicleNo, lrNo,
      clientGst, clientName, clientAddress, clientState, clientStateCode,
      addressUsed, lineItems, ...totals
    };

    try {
      await saveInvoice(invoice);
      await generateInvoicePDF(invoice);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save invoice.");
    }
  };

  const totals = calculateTotals();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Header / தலைப்பு</Text>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Invoice No</Text>
            <TextInput style={styles.input} value={invoiceNo} onChangeText={setInvoiceNo} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} />
          </View>
        </View>
        
        <Text style={styles.label}>Select Address / முகவரி தேர்வு</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={addressUsed}
            onValueChange={(v) => setAddressUsed(v)}
            style={styles.picker}
          >
            {COMPANY_DETAILS.addresses.map((addr, i) => (
              <Picker.Item key={i} label={addr} value={addr} />
            ))}
          </Picker>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle No</Text>
            <TextInput style={styles.input} placeholder="TN 33 AB 1234" value={vehicleNo} onChangeText={setVehicleNo} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>L.R. No</Text>
            <TextInput style={styles.input} placeholder="Optional" value={lrNo} onChangeText={setLrNo} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill To / யாருக்கு</Text>
        <Text style={styles.label}>GSTIN (15 Chars)</Text>
        <TextInput 
          style={[styles.input, styles.gstInput]} 
          autoCapitalize="characters" 
          maxLength={15}
          value={clientGst}
          onChangeText={handleGstLookup}
          placeholder="Enter GSTIN for lookup"
        />
        
        <Text style={styles.label}>Company Name</Text>
        <TextInput style={styles.input} value={clientName} onChangeText={setClientName} />
        
        <Text style={styles.label}>Address</Text>
        <TextInput style={[styles.input, { height: 60 }]} multiline value={clientAddress} onChangeText={setClientAddress} />
        
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput style={styles.input} value={clientState} onChangeText={setClientState} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Code</Text>
            <TextInput style={styles.input} value={clientStateCode} onChangeText={setClientStateCode} keyboardType="numeric" />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Line Items / விவரங்கள்</Text>
        {lineItems.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>Item #{index + 1}</Text>
              <TouchableOpacity style={styles.trashIcon} onPress={() => removeRow(index)}>
                <Trash2 size={20} color="#ff4d4f" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={item.description}
                onValueChange={(v) => updateLineItem(index, 'description', v)}
                style={styles.picker}
              >
                {LINE_ITEM_DEFAULTS.map((d, i) => (
                  <Picker.Item key={i} label={d.label} value={d.label} />
                ))}
                <Picker.Item label="Other / இதர" value="Other" />
              </Picker>
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bags</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={item.bags.toString()} onChangeText={(v) => updateLineItem(index, 'bags', v)} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={item.quantity.toString()} onChangeText={(v) => updateLineItem(index, 'quantity', v)} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rate</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={item.rate.toString()} onChangeText={(v) => updateLineItem(index, 'rate', v)} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount</Text>
                <TextInput style={[styles.input, styles.readOnly]} value={item.amount.toFixed(2)} editable={false} />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addRow}>
          <Plus size={20} color="#004aad" />
          <Text style={styles.addButtonText}>Add Row / வரிசை சேர்க்க</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Totals / மொத்தம்</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{totals.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>CGST (2.5%):</Text>
          <Text style={styles.totalValue}>{totals.cgst.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>SGST (2.5%):</Text>
          <Text style={styles.totalValue}>{totals.sgst.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }]}>
          <Text style={styles.totalLabel}>Total (Before Rounding):</Text>
          <Text style={styles.totalValue}>₹ {(totals.subtotal + totals.cgst + totals.sgst).toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Rounding:</Text>
          <Text style={[styles.totalValue, { color: '#666' }]}>
            { (totals.grandTotal - (totals.subtotal + totals.cgst + totals.sgst)).toFixed(2) }
          </Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Grand Total / மொத்தம்:</Text>
          <Text style={styles.grandTotalValue}>₹ {totals.grandTotal}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save & Print</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#004aad',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  gstInput: {
    fontFamily: 'monospace',
    letterSpacing: 2,
    fontSize: 22,
    fontWeight: 'bold',
  },
  readOnly: {
    backgroundColor: '#f8f9fa',
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  itemRow: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemNumber: {
    fontWeight: 'bold',
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#004aad',
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 8,
    color: '#004aad',
    fontFamily: 'Outfit_700Bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    color: '#666',
  },
  totalValue: {
    fontFamily: 'Outfit_700Bold',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#004aad',
  },
  grandTotalLabel: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#004aad',
  },
  grandTotalValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#2b8a3e',
  },
  actionButtons: {
    padding: 12,
  },
  saveButton: {
    backgroundColor: '#004aad',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginLeft: 12,
  },
  // Hide UI elements during accidental browser printing
  '@media print': {
    saveButton: { display: 'none' },
    addButton: { display: 'none' },
    trashIcon: { display: 'none' },
    header: { display: 'none' },
  }
});
