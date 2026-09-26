export type OrderStatus = 'pending_payment' | 'cooking' | 'ready' | 'on_delivery' | 'completed' | 'cancelled';

export type PaymentMethod = 'cashier' | 'qris';

export type OrderType = 'dine_in' | 'delivery' | 'takeaway';

export interface MenuItemOption {
  name: string;
  choices: {
    label: string;
    extraPrice?: number;
  }[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Ayam & Bebek' | 'Ikan & Seafood' | 'Sate & Jeroan' | 'Sayur & Pelengkap' | 'Nasi & Minuman' | 'Aneka Sambal' | string;
  price: number;
  description: string;
  image: string;
  isPopular?: boolean;
  isAvailable?: boolean;
  options?: MenuItemOption[];
}

export interface CartItemOptionSelected {
  optionName: string;
  choiceLabel: string;
  extraPrice: number;
}

export interface CartItem {
  itemId: string;
  name: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  selectedOptions: CartItemOptionSelected[];
  notes?: string;
  image: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  fee: number;
  estimatedTime: string;
  isActive: boolean;
}

export interface DeliverySettings {
  isEnabled: boolean;
  minOrderAmount: number;
  freeDeliveryThreshold?: number;
  whatsappNumber: string;
  zones: DeliveryZone[];
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-082"
  orderType?: OrderType; // 'dine_in' | 'delivery' | 'takeaway'
  tableNumber: string; // e.g. "05" or "DLV" or "TA"
  customerName: string;
  customerPhone?: string; // untuk konfirmasi & delivery
  deliveryAddress?: string; // alamat pengantaran
  deliveryNotes?: string; // patokan rumah / instruksi kurir
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  deliveryFee?: number; // ongkos kirim
  pickupTime?: string; // untuk takeaway
  items: CartItem[];
  subtotal: number;
  tax: number; // 10% PB1
  total: number;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  status: OrderStatus;
  createdAt: string; // ISO String
  updatedAt: string;
}

export interface StoreConfig {
  isOpen: boolean;
  autoSchedule: boolean;
  openTime: string; // "10:00"
  closeTime: string; // "22:00"
  closedMessage: string;
}
