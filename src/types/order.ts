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
  deliveryDistanceKm?: number; // Jarak pengantaran dalam KM
  deliveryFee?: number; // ongkos kirim
  pickupTime?: string; // untuk takeaway
  items: CartItem[];
  subtotal: number;
  tax?: number; // Opsional / 0 (Tanpa pajak PB1)
  discountCode?: string;
  discountAmount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  status: OrderStatus;
  createdAt: string; // ISO String
  updatedAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  title: string;
  type: 'fixed' | 'percent';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  description?: string;
  isActive: boolean;
}

export interface StoreConfig {
  isOpen: boolean;
  autoSchedule: boolean;
  openTime: string; // "10:00"
  closeTime: string; // "22:00"
  closedMessage: string;
  storeAddress?: string; // Alamat fisik resto
  storeLatitude?: number; // Titik GPS latitude toko
  storeLongitude?: number; // Titik GPS longitude toko
  storePhone?: string; // Nomor WhatsApp resmi toko
}

