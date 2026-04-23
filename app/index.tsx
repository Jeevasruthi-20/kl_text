import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { PlusCircle, History, ReceiptText } from 'lucide-react-native';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/logo.png')} 
          style={{ width: 120, height: 120, marginBottom: 10 }}
          resizeMode="contain"
        />
        <Text style={styles.title}>K.L. Textiles</Text>
        <Text style={styles.subtitle}>Billing System / பில்லிங் சிஸ்டம்</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/invoice/new')}
        >
          <PlusCircle size={32} color="#fff" />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>New Invoice</Text>
            <Text style={styles.buttonSubtitle}>புதிய விலைப்பட்டியல்</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.historyButton]} 
          onPress={() => router.push('/invoice/history')}
        >
          <History size={32} color="#fff" />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Past Invoices</Text>
            <Text style={styles.buttonSubtitle}>கடந்த கால விலைப்பட்டியல்கள்</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Outfit_700Bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    gap: 20,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#004aad',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  historyButton: {
    backgroundColor: '#4c6ef5',
  },
  buttonTextContainer: {
    marginLeft: 24,
  },
  buttonTitle: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'Outfit_700Bold',
  },
  buttonSubtitle: {
    color: '#e9ecef',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
  },
  version: {
    color: '#aaa',
    fontSize: 12,
  }
});
