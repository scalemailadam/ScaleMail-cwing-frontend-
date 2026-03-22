import { useState } from "react";
import { useRouter } from "next/router";
import { PayPalButtons } from "@paypal/react-paypal-js";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useCart } from "@/context/CartContext";

const SHIPPING = 15;

interface CustomerInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const [info, setInfo] = useState<CustomerInfo>({
    name: "", email: "", address: "", city: "", zip: "", country: "",
  });

  const formComplete = Object.values(info).every((v) => v.trim() !== "");
  const total = totalPrice + SHIPPING;

  const handleField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-tech-white text-tech-gray-800 flex flex-col">
        <StoreHeader sortOrder={sortOrder} onSortChange={setSortOrder} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="flex-1 pt-16 flex flex-col items-center justify-center gap-6">
          <p className="font-mono text-xs tracking-widest">YOUR CART IS EMPTY</p>
          <button onClick={() => router.push("/store")} className="font-mono text-xs tracking-widest border border-tech-black px-8 py-3 hover:bg-tech-black hover:text-tech-white transition-colors cursor-pointer">
            CONTINUE SHOPPING
          </button>
        </main>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tech-white text-tech-gray-800 flex flex-col">
      <StoreHeader sortOrder={sortOrder} onSortChange={setSortOrder} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-1 pt-16 px-4 lg:px-16 py-12">
        <button onClick={() => router.push("/store/cart")} className="font-mono text-xs tracking-widest text-tech-gray-800 hover:text-tech-black mb-10 flex items-center gap-2 cursor-pointer">
          ← BACK TO CART
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Order Summary + Shipping Info */}
          <div className="space-y-12">
            {/* Order Summary */}
            <div>
              <h2 className="font-mono text-xs tracking-widest mb-6">ORDER SUMMARY</h2>
              <div className="divide-y divide-tech-gray-200">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between py-4 font-mono text-xs tracking-wide">
                    <div>
                      <div className="tracking-widest">{item.code}</div>
                      <div className="text-tech-gray-800 mt-0.5">{item.color} / {item.size} × {item.quantity}</div>
                    </div>
                    <div>${(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-tech-gray-200 pt-4 space-y-2 mt-2">
                <div className="flex justify-between font-mono text-xs tracking-widest">
                  <span className="text-tech-gray-800">SUBTOTAL</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono text-xs tracking-widest">
                  <span className="text-tech-gray-800">SHIPPING</span>
                  <span>${SHIPPING.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-sm tracking-widest border-t border-tech-gray-200 pt-2 mt-2">
                  <span>TOTAL</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-tech-gray-800 tracking-wide mt-4">
                For international orders, contact us for a shipping quote.
              </p>
            </div>

            {/* Shipping Info */}
            <div>
              <h2 className="font-mono text-xs tracking-widest mb-6">SHIPPING INFO</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "name", label: "NAME", colSpan: 1 },
                  { name: "email", label: "EMAIL", colSpan: 1 },
                  { name: "address", label: "ADDRESS", colSpan: 2 },
                  { name: "city", label: "CITY", colSpan: 1 },
                  { name: "zip", label: "ZIP / POSTAL", colSpan: 1 },
                  { name: "country", label: "COUNTRY", colSpan: 2 },
                ].map(({ name, label, colSpan }) => (
                  <div key={name} className={colSpan === 2 ? "col-span-2" : ""}>
                    <label className="font-mono text-xs tracking-widest text-tech-gray-800 block mb-2">{label}</label>
                    <input
                      type={name === "email" ? "email" : "text"}
                      name={name}
                      value={info[name as keyof CustomerInfo]}
                      onChange={handleField}
                      required
                      className="w-full font-mono text-xs tracking-widest border border-tech-gray-300 px-4 py-3 bg-transparent outline-none focus:border-tech-black transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Payment */}
          <div>
            <h2 className="font-mono text-xs tracking-widest mb-6">PAYMENT</h2>

            {!formComplete && (
              <p className="font-mono text-xs tracking-widest text-tech-gray-800 mb-4">
                Complete your shipping info to pay.
              </p>
            )}

            {error && (
              <p className="font-mono text-xs tracking-widest text-red-600 mb-4">{error}</p>
            )}

            <div className={!formComplete ? "opacity-40 pointer-events-none" : ""}>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", label: "pay" }}
                createOrder={async () => {
                  setError("");
                  const res = await fetch("/api/create-paypal-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items, shipping: SHIPPING }),
                  });
                  const data = await res.json();
                  if (!data.orderID) throw new Error("Failed to create order");
                  return data.orderID;
                }}
                onApprove={async (data) => {
                  const res = await fetch("/api/capture-paypal-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderID: data.orderID,
                      items,
                      shipping: SHIPPING,
                      customerInfo: info,
                    }),
                  });
                  const result = await res.json();
                  if (result.status === "COMPLETED") {
                    clearCart();
                    router.push("/store/thank-you?type=order");
                  } else {
                    setError("Payment could not be confirmed. Please try again.");
                  }
                }}
                onError={() => setError("Payment failed. Please try again.")}
                onCancel={() => setError("Payment cancelled.")}
              />
            </div>

            <p className="font-mono text-[10px] leading-relaxed text-tech-gray-800 tracking-wide mt-6">
              Each piece is made to order — cut, assembled, and finished specifically for you. Please allow time for production. Thank you for choosing Scale Mail.
            </p>
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
