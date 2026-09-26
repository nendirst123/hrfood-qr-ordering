export type OrderStatus = 'pending_payment' | 'cooking' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod = 'cashier' | 'qris';

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

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-082"
  tableNumber: string; // e.g. "05"
  customerName: string;
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
