import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, ScrollView, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Search, Plus, Trash2, Eye } from 'lucide-react-native';
import { lookupGST, getGstErrorMessage, getOfflineGstData } from '../../services/gstApi';
import { getLastInvoiceNo } from '../../services/database';
import { COMPANY_DETAILS, LINE_ITEM_DEFAULTS } from '../../constants/Company';

interface LineItem {
  description: string;
  hsn: string;
  bags: number;
  quantity: number;
  rate: number;
  amount: number;
}

export default function NewInvoice() {
  const router = useRouter();

  // FORM STATE
  const [invoiceNo, setInvoiceNo] = useState('JW-001');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [vehicleNo, setVehicleNo] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [addressUsed, setAddressUsed] = useState(COMPANY_DETAILS.addresses[0]);

  const [clientGst, setClientGst] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientState, setClientState] = useState('');
  const [clientStateCode, setClientStateCode] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Job Work Charges', hsn: '9988', bags: 0, quantity: 0, rate: 12.50, amount: 0 }
  ]);

  useEffect(() => {
    loadNextInvoiceNo();
  }, []);

  const loadNextInvoiceNo = async () => {
    const last = await getLastInvoiceNo();
    if (last) {
      const match = last.match(/JW-(\d+)/);
      if (match) {
        const num = parseInt(match[1]) + 1;
        setInvoiceNo(`JW-${num}`);
      }
    }
  };

  const handleGstLookup = async (gst: string) => {
    const cleanGst = gst.trim().toUpperCase();
    setClientGst(cleanGst);
    if (cleanGst.length !== 15) return;

    setLookupStatus('loading');
    setLookupError(null);
    try {
      const result = await lookupGST(cleanGst);
      if (result.success) {
        setClientName(result.data.companyName);
        setClientAddress(result.data.address);
        setClientState(result.data.state);
        setClientStateCode(result.data.stateCode);
        setLookupStatus('success');
      } else {
        // Network failed? Try offline state derivation at least
        const offline = getOfflineGstData(cleanGst);
        if (offline.state) {
          setClientState(offline.state);
          setClientStateCode(offline.stateCode || '');
        }
        setLookupStatus('error');
        setLookupError(getGstErrorMessage(result.error));
      }
    } catch (e) {
      setLookupStatus('error');
      setLookupError('Lookup failed / பிழை ஏற்பட்டது');
    }
  };

  const addRow = () => {
    setLineItems([...lineItems, { description: 'Job Work Charges', hsn: '9988', bags: 0, quantity: 0, rate: 12.50, amount: 0 }]);
  };

  const removeRow = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    const item = { ...newItems[index] };

    if (field === 'bags') {
      const bags = parseInt(value) || 0;
      item.bags = bags;
      item.quantity = bags * 75; // Auto calc weight
    } else if (field === 'quantity') {
      item.quantity = parseFloat(value) || 0;
    } else if (field === 'rate') {
      item.rate = parseFloat(value) || 0;
    } else if (field === 'description') {
      item.description = value;
      const def = LINE_ITEM_DEFAULTS.find(d => d.label === value);
      if (def) item.hsn = def.hsn;
    }

    item.amount = item.quantity * item.rate;
    newItems[index] = item;
    setLineItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, i) => sum + i.amount, 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const grandTotal = Math.round(subtotal + cgst + sgst);
    const totalBags = lineItems.reduce((sum, i) => sum + i.bags, 0);
    const totalQuantity = lineItems.reduce((sum, i) => sum + i.quantity, 0);

    return { subtotal, cgst, sgst, grandTotal, totalBags, totalQuantity };
  };

  const goToPreview = () => {
    if (!clientName || !clientGst || lineItems.some(i => i.quantity <= 0)) {
      if (Platform.OS === 'web') {
        window.alert("Missing Info / தகவல் விடுபட்டுள்ளது: Please fill all required fields and ensure quantities are greater than zero.");
      } else {
        Alert.alert("Missing Info / தகவல் விடுபட்டுள்ளது", "Please fill all required fields and ensure quantities are greater than zero.");
      }
      return;
    }

    const totals = calculateTotals();
    router.push({
      pathname: '/invoice/preview',
      params: {
        invoiceNo, date, time, vehicleNo, lrNo,
        clientGst, clientName, clientAddress, 
        clientState, clientStateCode, addressUsed,
        lineItems: JSON.stringify(lineItems),
        subtotal: String(totals.subtotal),
        cgst: String(totals.cgst),
        sgst: String(totals.sgst),
        igst: '0',
        grandTotal: String(totals.grandTotal),
        totalBags: String(totals.totalBags),
        totalQuantity: String(totals.totalQuantity),
      }
    });
  };

  const handleClear = () => {
    Alert.alert(
      "Clear Form / படிவத்தை அழிக்கவும்",
      "Are you sure you want to clear all fields?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            setClientGst('');
            setClientName('');
            setClientAddress('');
            setClientState('');
            setClientStateCode('');
            setVehicleNo('');
            setLrNo('');
            setLineItems([{ description: 'Job Work Charges', hsn: '9988', bags: 0, quantity: 0, rate: 12.50, amount: 0 }]);
            setLookupStatus('idle');
            setLookupError(null);
            loadNextInvoiceNo();
            setDate(new Date().toLocaleDateString('en-GB'));
            setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f3f5' }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* COMPANY HEADER CARD */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>K.L. Textiles</Text>
          <View style={styles.headerPickerWrapper}>
            <Picker
              selectedValue={addressUsed}
              onValueChange={(v) => setAddressUsed(v)}
              style={{ height: 40 }}
            >
              {COMPANY_DETAILS.addresses.map((addr, i) => (
                <Picker.Item key={i} label={addr.slice(0, 35) + '...'} value={addr} style={{ fontSize: 13 }} />
              ))}
            </Picker>
          </View>
          <Text style={styles.headerMeta}>GST: 33AMDPM0134C1ZV  |  Ph: 9443840407</Text>
        </View>

        {/* INVOICE DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details / விவரங்கள்</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Invoice No</Text>
              <TextInput style={styles.input} value={invoiceNo} onChangeText={setInvoiceNo} />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Date</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} />
            </View>
          </View>
          
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Time</Text>
              <TextInput style={styles.input} value={time} onChangeText={setTime} />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Vehicle No</Text>
              <TextInput style={styles.input} placeholder="TN 33..." value={vehicleNo} onChangeText={setVehicleNo} />
            </View>
          </View>

          <Text style={styles.label}>L.R. No (Optional)</Text>
          <TextInput style={styles.input} value={lrNo} onChangeText={setLrNo} />
        </View>

        {/* BILL TO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To / யாருக்கு</Text>
          <View style={styles.gridRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>GSTIN</Text>
              <TextInput 
                style={[styles.input, { fontWeight: 'bold' }]} 
                autoCapitalize="characters" 
                maxLength={15}
                value={clientGst}
                onChangeText={(text) => handleGstLookup(text)}
              />
            </View>
            <TouchableOpacity 
              style={styles.lookupBtn} 
              onPress={() => handleGstLookup(clientGst)}
            >
              {lookupStatus === 'loading' ? <ActivityIndicator size="small" color="#fff" /> : <Search size={18} color="#fff" />}
              <Text style={styles.lookupBtnText}>Lookup</Text>
            </TouchableOpacity>
          </View>

          {lookupError && <Text style={styles.errorText}>{lookupError}</Text>}

          <Text style={styles.label}>Company Name</Text>
          <TextInput style={styles.input} value={clientName} onChangeText={setClientName} />
          
          <Text style={styles.label}>Address</Text>
          <TextInput 
            style={[styles.input, { height: 70 }]} 
            multiline numberOfLines={3} 
            value={clientAddress} 
            onChangeText={setClientAddress} 
          />

          <View style={styles.gridRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={clientState} onChangeText={setClientState} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Code</Text>
              <TextInput style={styles.input} value={clientStateCode} onChangeText={setClientStateCode} maxLength={2} />
            </View>
          </View>
        </View>

        {/* LINE ITEMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items / விவரங்கள்</Text>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.gridRow}>
                <View style={{ flex: 4 }}>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={item.description}
                      onValueChange={(v) => updateLineItem(index, 'description', v)}
                      style={{ height: 45 }}
                    >
                      {LINE_ITEM_DEFAULTS.map((d, i) => <Picker.Item key={i} label={d.label} value={d.label} />)}
                    </Picker>
                  </View>
                  <Text style={styles.hsnTag}>HSN: {item.hsn}</Text>
                </View>
                <TouchableOpacity onPress={() => removeRow(index)} style={styles.trashBtn}>
                  <Trash2 size={20} color="#ff4d4f" />
                </TouchableOpacity>
              </View>

              <View style={[styles.gridRow, { marginTop: 12 }]}>
                <View style={styles.gridCol}>
                  <Text style={styles.miniLabel}>Bags</Text>
                  <TextInput style={styles.miniInput} keyboardType="numeric" value={item.bags.toString()} onChangeText={(v) => updateLineItem(index, 'bags', v)} />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.miniLabel}>Qty (kg)</Text>
                  <TextInput style={styles.miniInput} keyboardType="numeric" value={item.quantity.toString()} onChangeText={(v) => updateLineItem(index, 'quantity', v)} />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.miniLabel}>Rate</Text>
                  <TextInput style={styles.miniInput} keyboardType="numeric" value={item.rate.toString()} onChangeText={(v) => updateLineItem(index, 'rate', v)} />
                </View>
                <View style={[styles.gridCol, { flex: 1.2 }]}>
                  <Text style={styles.miniLabel}>Amount</Text>
                  <Text style={styles.itemAmount}>₹{item.amount.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addRow}>
            <Plus size={20} color="#004aad" />
            <Text style={styles.addBtnText}>Add Another Row</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BOTTOM ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.btnTextSecondary}>Clear Form</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.previewBtn} onPress={goToPreview}>
          <Eye size={20} color="#fff" />
          <Text style={styles.btnText}>Preview Invoice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#004aad', marginBottom: 10 },
  headerPickerWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  headerMeta: { fontSize: 12, color: '#666' },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004aad',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 8,
  },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  gridCol: { flex: 1 },
  label: { fontSize: 14, color: '#555', marginBottom: 5, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fafbfc',
  },
  lookupBtn: {
    backgroundColor: '#004aad',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 8,
  },
  lookupBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: -5, marginBottom: 10 },
  itemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  hsnTag: { fontSize: 11, color: '#888', marginTop: 4, marginLeft: 2 },
  trashBtn: { padding: 10 },
  miniLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  miniInput: {
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  itemAmount: { fontSize: 14, fontWeight: 'bold', color: '#2ecc71', marginTop: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#004aad',
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
  },
  addBtnText: { color: '#004aad', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    gap: 12,
    elevation: 10,
  },
  previewBtn: {
    flex: 2,
    backgroundColor: '#2a4a3e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#95a5a6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnTextSecondary: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
