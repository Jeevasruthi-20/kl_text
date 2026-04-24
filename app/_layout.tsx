import { Stack } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../services/database';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
  });

  useEffect(() => {
    initDatabase();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#004aad',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: 'Outfit_700Bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'KL Textiles' }} />
      <Stack.Screen name="invoice/new" options={{ title: 'New Invoice / புதிய விலைப்பட்டியல்' }} />
      <Stack.Screen name="invoice/preview" options={{ title: 'Invoice Preview' }} />
      <Stack.Screen name="invoice/history" options={{ title: 'Past Invoices' }} />
    </Stack>
  );
}
