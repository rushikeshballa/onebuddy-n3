import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { groceryDb } from '../config';
import { Order } from '../../categories/groceries/types/order.types';

/* ─────────────── Defensive Mapper ─────────────── */

export function mapOrder(docId: string, data: any): Order {
  return {
    id: data.id || docId,
    userId: data.userId || '',
    items: Array.isArray(data.items)
      ? data.items.map((it: any, idx: number) => ({
          id: it.id || `oi_${idx}`,
          productId: it.productId || '',
          productName: it.productName || '',
          productImage: it.productImage || '',
          unit: it.unit || '',
          price: typeof it.price === 'number' ? it.price : 0,
          discountPrice: typeof it.discountPrice === 'number' ? it.discountPrice : (it.price || 0),
          quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        }))
      : [],
    subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
    discount: typeof data.discount === 'number' ? data.discount : 0,
    deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
    tax: typeof data.tax === 'number' ? data.tax : 0,
    total: typeof data.total === 'number' ? data.total : 0,
    status: data.status || 'placed',
    deliveryAddress: data.deliveryAddress || {
      id: 'addr_default',
      name: '',
      phone: '',
      houseNumber: '',
      street: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      type: 'home',
    },
    deliverySlot: data.deliverySlot || {
      id: 'slot_default',
      date: 'Today',
      startTime: '09:00 AM',
      endTime: '11:00 AM',
      available: true,
    },
    paymentMethod: data.paymentMethod || 'cash_on_delivery',
    paymentStatus: data.paymentStatus || 'pending',
    createdAt: data.createdAt || new Date().toISOString(),
    estimatedDelivery: data.estimatedDelivery || '',
    trackingSteps: Array.isArray(data.trackingSteps)
      ? data.trackingSteps.map((st: any) => ({
          status: st.status || 'placed',
          title: st.title || '',
          description: st.description || '',
          time: st.time,
          completed: Boolean(st.completed),
        }))
      : undefined,
  };
}

/* ─────────────── One-Time Fetchers ─────────────── */

export async function fetchOrders(userId?: string): Promise<Order[]> {
  if (!groceryDb) {
    console.warn('[GroceryBackend] groceryDb is not initialized.');
    return [];
  }
  try {
    let snap;
    if (userId) {
      const q = query(collection(groceryDb, 'orders'), where('userId', '==', userId));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(collection(groceryDb, 'orders'));
    }
    const orders = snap.docs.map((d) => mapOrder(d.id, d.data()));
    // Sort orders by createdAt descending
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (err) {
    console.error('[GroceryBackend] Error fetching orders:', err);
    return [];
  }
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  if (!groceryDb) return null;
  try {
    const ref = doc(groceryDb, 'orders', orderId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return mapOrder(snap.id, snap.data());
    }
  } catch (err) {
    console.error(`[GroceryBackend] Error fetching order ${orderId}:`, err);
  }
  return null;
}

export async function saveOrder(order: Order): Promise<void> {
  if (!groceryDb) {
    throw new Error('[GroceryBackend] groceryDb is not initialized.');
  }
  const ref = doc(groceryDb, 'orders', order.id);
  await setDoc(ref, order);
}

/* ─────────────── Real-Time Subscriptions ─────────────── */

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  userId?: string,
  onError?: (err: Error) => void
): () => void {
  if (!groceryDb) {
    onData([]);
    return () => {};
  }
  const ordersColl = collection(groceryDb, 'orders');
  const q = userId ? query(ordersColl, where('userId', '==', userId)) : ordersColl;

  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs.map((d) => mapOrder(d.id, d.data()));
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(orders);
    },
    (err) => {
      console.error('[GroceryBackend] Orders subscription error:', err);
      onError?.(err);
    }
  );
}
