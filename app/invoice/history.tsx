import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Printer, Calendar, FileText, ChevronRight, Search } from 'lucide-react-native';
import { getInvoices, Invoice } from '../../services/database';
import { generateInvoicePDF } from '../../services/pdfGenerator';

export default function InvoiceHistory() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = async () => {
    setRefreshing(true);
    const data = await getInvoices();
    setInvoices(data);
    setFilteredInvoices(data);
    setRefreshing(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredInvoices(invoices);
      return;
    }
    const filtered = invoices.filter(item => 
      item.invoiceNo.toLowerCase().includes(query.toLowerCase()) ||
      item.clientName.toLowerCase().includes(query.toLowerCase()) ||
      item.clientGst.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredInvoices(filtered);
  };

  const renderItem = ({ item }: { item: Invoice }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.invoiceNo}</Text>
        </View>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      
      <Text style={styles.clientName}>{item.clientName}</Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.amount}>₹ {item.grandTotal.toLocaleString('en-IN')}</Text>
        <TouchableOpacity style={styles.printButton} onPress={() => generateInvoicePDF(item)}>
          <Printer size={20} color="#004aad" />
          <Text style={styles.printText}>Re-print</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, GST, or Invoice No..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      <FlatList
        data={filteredInvoices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || item.invoiceNo}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadInvoices} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <FileText size={64} color="#ccc" />
            <Text style={styles.emptyText}>No invoices found</Text>
            <Text style={styles.emptySubtitle}>சேமிக்கப்பட்ட விவரங்கள் எதுவும் இல்லை</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f1f3f5',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#e7f5ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#004aad',
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
  },
  date: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  clientName: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#333',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  amount: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#2b8a3e',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  printText: {
    marginLeft: 6,
    color: '#004aad',
    fontFamily: 'Outfit_700Bold',
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  }
});
