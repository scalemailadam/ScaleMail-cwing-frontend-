import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: string;
  code: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  availableStock?: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("scalemail-cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Persist to localStorage on every change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("scalemail-cart", JSON.stringify(items));
  }, [items, loaded]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const maxStock = newItem.availableStock;
      const totalInCart = prev
        .filter((i) => i.productId === newItem.productId)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (maxStock !== null && maxStock !== undefined && totalInCart >= maxStock) return prev;

      const existing = prev.find(
        (i) => i.productId === newItem.productId && i.size === newItem.size && i.color === newItem.color
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId && i.size === newItem.size && i.color === newItem.color
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (productId: string, size: string, color: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size && i.color === color)));
  };

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId, size, color);
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId && i.size === size && i.color === color);
      const maxStock = item?.availableStock;
      const otherTotal = prev
        .filter((i) => i.productId === productId && !(i.size === size && i.color === color))
        .reduce((sum, i) => sum + i.quantity, 0);
      const cap = maxStock !== null && maxStock !== undefined ? Math.max(0, maxStock - otherTotal) : Infinity;
      const clamped = Math.min(quantity, cap);
      if (clamped <= 0) return prev.filter((i) => !(i.productId === productId && i.size === size && i.color === color));
      return prev.map((i) =>
        i.productId === productId && i.size === size && i.color === color ? { ...i, quantity: clamped } : i
      );
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("scalemail-cart");
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
