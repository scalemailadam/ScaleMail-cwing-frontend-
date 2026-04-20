import { useState } from "react";
import { useRouter } from "next/router";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useCart } from "@/context/CartContext";

const SHIPPING_RATES: Record<string, number> = {
  IL: 15,
  US: 75,
};
const DEFAULT_SHIPPING = 100;
const getShipping = (code: string) => SHIPPING_RATES[code] ?? DEFAULT_SHIPPING;

const COUNTRIES = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" }, { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" }, { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" }, { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" }, { code: "CL", name: "Chile" },
  { code: "CN", name: "China" }, { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" }, { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" }, { code: "EG", name: "Egypt" },
  { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" }, { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" }, { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" }, { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" }, { code: "KZ", name: "Kazakhstan" },
  { code: "KR", name: "South Korea" }, { code: "KW", name: "Kuwait" },
  { code: "LB", name: "Lebanon" }, { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" }, { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" }, { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" }, { code: "PK", name: "Pakistan" },
  { code: "PE", name: "Peru" }, { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" }, { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" }, { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" }, { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" }, { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" }, { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
];

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

  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const formComplete = Object.values(info).every((v) => v.trim() !== "");
  const shipping = getShipping(info.country);
  const total = totalPrice + shipping;

  const handleField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-tech-white text-tech-gray-800 flex flex-col">
        <StoreHeader sortOrder={sortOrder} onSortChange={setSortOrder} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="flex-1 pt-16 flex flex-col items-center justify-center gap-6">
          <p className="font-mono text-xs tracking-widest">YOUR CART IS EMPTY</p>
          <button onClick={() => router.push("/store/shop")} className="font-mono text-xs tracking-widest border border-tech-black px-8 py-3 hover:bg-tech-black hover:text-tech-white transition-colors cursor-pointer">
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
                  <span>{info.country ? `$${shipping.toFixed(2)}` : "—"}</span>
                </div>
                <div className="flex justify-between font-mono text-sm tracking-widest border-t border-tech-gray-200 pt-2 mt-2">
                  <span>TOTAL</span>
                  <span>{info.country ? `$${total.toLocaleString()}` : "—"}</span>
                </div>
              </div>
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
                <div className="col-span-2">
                  <label className="font-mono text-xs tracking-widest text-tech-gray-800 block mb-2">COUNTRY</label>
                  <select
                    name="country"
                    value={info.country}
                    onChange={handleField}
                    required
                    className="w-full font-mono text-xs tracking-widest border border-tech-gray-300 px-4 py-3 bg-transparent outline-none focus:border-tech-black transition-colors cursor-pointer"
                  >
                    <option value="">Select country…</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
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

            {isPending && (
              <p className="font-mono text-xs tracking-widest text-tech-gray-800 mb-4">LOADING PAYPAL...</p>
            )}

            {isRejected && (
              <p className="font-mono text-xs tracking-widest text-red-600 mb-4">
                PayPal failed to load. Check that NEXT_PUBLIC_PAYPAL_CLIENT_ID is set in your environment.
              </p>
            )}

            <div className={!formComplete ? "opacity-40 pointer-events-none" : ""}>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", label: "pay" }}
                createOrder={async () => {
                  setError("");
                  const res = await fetch("/api/create-paypal-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items, shipping, customerInfo: info }),
                  });
                  const data = await res.json();
                  if (data.outOfStock) { setError(data.error); throw new Error(data.error); }
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
                      shipping,
                      customerInfo: info,
                    }),
                  });
                  const result = await res.json();
                  if (result.status === "COMPLETED") {
                    clearCart();
                    router.push("/store/thank-you?type=order");
                  } else if (result.oversold) {
                    setError(result.error);
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
