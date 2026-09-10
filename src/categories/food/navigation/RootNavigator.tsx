import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, InteractionManager } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Device from 'expo-device';
import type { FoodStackParamList } from '../types/navigation.types';
import { BottomTabNavigator } from './BottomTabNavigator';
import { RestaurantMenuScreen } from '../screens/RestaurantMenuScreen';
import { LocationSearchScreen } from '../screens/LocationSearchScreen';
import { AddAddressScreen } from '../screens/AddAddressScreen';
import CartScreen from '../components/cart/CartScreen';
import PaymentCheckoutScreen from '../components/cart/PaymentCheckoutScreen';
import FeedbackFormScreen from '../components/common/FeedbackFormScreen';
import { Header } from '../components/common/Header';
import { BottomNavBar } from '../components/navigation/BottomNavBar';
import { ConflictModal } from '../components/common/ConflictModal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { loadAddresses } from '../data/address';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // Notifications optional or unsupported in current environment
}

const Stack = createNativeStackNavigator<FoodStackParamList>();

function RestaurantMenuWrapper({ route, navigation }: any) {
  const restaurantId = route.params?.restaurantId || 'paradise-restaurant';

  const handleNavigate = (screen: string) => {
    if (screen === 'home') {
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else if (screen === 'orders') {
      navigation.navigate('MainTabs', { screen: 'Orders' });
    } else if (screen === 'favorites') {
      navigation.navigate('MainTabs', { screen: 'Favorites' });
    } else if (screen === 'cart') {
      navigation.navigate('Cart');
    } else if (screen === 'location-search') {
      navigation.navigate('LocationSearch');
    } else if (screen === 'add-address') {
      navigation.navigate('AddAddress', {});
    } else if (screen === 'restaurant-menu') {
      // already on restaurant menu
    }
  };

  return (
    <View style={styles.menuContainer}>
      <Header
        activeScreen="restaurant-menu"
        onNavigate={handleNavigate}
        onEditAddress={(address) => {
          navigation.navigate('AddAddress', { initialData: address });
        }}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.menuContent}>
        <RestaurantMenuScreen
          restaurantId={restaurantId}
          onBack={() => navigation.goBack()}
        />
      </View>
      <BottomNavBar
        activeScreen="restaurant-menu"
        onNavigate={handleNavigate}
        onFocusSearch={() => {
          navigation.navigate('MainTabs', { screen: 'Home' });
        }}
      />
    </View>
  );
}

function CheckoutScreenWrapper({ route, navigation }: any) {
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  return (
    <PaymentCheckoutScreen
      grandTotal={route.params?.grandTotal}
      cartItems={route.params?.cartItems}
      onBack={() => navigation.goBack()}
      onOrderSuccess={(orderData) => {
        setCompletedOrder({
          ...orderData,
          restaurantName: route.params?.restaurantName,
        });
      }}
      onFinishReceipt={() => {
        navigation.navigate('Feedback', {
          order: completedOrder || {
            restaurantName: route.params?.restaurantName,
            total: route.params?.grandTotal,
            orderDate: new Date().toISOString(),
          },
        });
      }}
    />
  );
}

export const RootNavigator: React.FC = () => {
  useEffect(() => {
    loadAddresses();

    const task = InteractionManager.runAfterInteractions(async () => {
      if (!Notifications) return;
      if (Platform.OS !== 'web' && Device.isDevice) {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            return;
          }
        } catch (e) {
          // ignore
        }
      } else if (Platform.OS === 'web') {
        try {
          await Notifications.requestPermissionsAsync();
        } catch (e) {
          // ignore
        }
      }
    });

    return () => task.cancel();
  }, []);

  return (
    <View style={styles.root}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: {
            backgroundColor: '#F3F4F6',
          },
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

        <Stack.Screen name="RestaurantMenu" component={RestaurantMenuWrapper} />

        <Stack.Screen name="Cart">
          {({ navigation }) => (
            <CartScreen
              onBack={() => navigation.goBack()}
              onProceed={(total, items, rName) => {
                navigation.navigate('PaymentCheckout', {
                  grandTotal: total,
                  cartItems: items,
                  restaurantName: rName,
                });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="PaymentCheckout" component={CheckoutScreenWrapper} />

        <Stack.Screen name="Feedback">
          {({ route, navigation }) => (
            <ErrorBoundary>
              <FeedbackFormScreen
                order={route.params?.order || {}}
                onComplete={() => navigation.navigate('MainTabs', { screen: 'Home' })}
              />
            </ErrorBoundary>
          )}
        </Stack.Screen>

        <Stack.Screen name="LocationSearch">
          {({ navigation }) => (
            <LocationSearchScreen
              onBack={() => navigation.goBack()}
              onLocationSelected={() => {
                navigation.navigate('AddAddress', { initialData: null });
              }}
              onEditAddress={(address) => {
                navigation.navigate('AddAddress', { initialData: address });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="AddAddress">
          {({ route, navigation }) => (
            <AddAddressScreen
              initialData={route.params?.initialData}
              onBack={() => navigation.goBack()}
              onSaveSuccess={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>

      <ConflictModal />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  menuContent: {
    flex: 1,
  },
});
