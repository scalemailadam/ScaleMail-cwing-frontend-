import { useRouter } from "next/router";
import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const orderMessage = items
    .map((item) => `${item.code} - ${item.name} / Size: ${item.size} / Color: ${item.color} / Qty: ${item.quantity} / USD ${(item.price * item.quantity).toLocaleString()}`)
    .join("\n");
  const fullMessage = `ORDER REQUEST FOR:\n${orderMessage}\nTOTAL: USD ${totalPrice.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-tech-white flex flex-col">
      <StoreHeader sortOrder={sortOrder} onSortChange={setSortOrder} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-1 pt-16 px-4 lg:px-16 py-12">
        <h1 className="font-mono text-sm tracking-widest mb-12">CART ({totalItems})</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <p className="font-mono text-xs tracking-widest text-tech-gray-500">YOUR CART IS EMPTY</p>
            <button onClick={() => router.push("/store")} className="font-mono text-xs tracking-widest border border-tech-black px-8 py-3 hover:bg-tech-black hover:text-tech-white transition-colors">
              CONTINUE SHOPPING
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Items */}
            <div className="lg:col-span-2 divide-y divide-tech-gray-200">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-6 py-6 first:pt-0">
                  <img src={item.image} alt={item.code} className="w-24 h-24 object-cover bg-tech-gray-100 cursor-pointer" onClick={() => router.push(`/store/product/${item.productId}`)} />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="font-mono text-xs tracking-widest">{item.code}</div>
                      <div className="font-mono text-xs text-tech-gray-500 tracking-wide mt-1">{item.name}</div>
                      <div className="font-mono text-xs text-tech-gray-500 tracking-wide mt-1">{item.size} / {item.color}</div>
                    </div>
                    <div className="flex items-center border border-tech-gray-300 w-fit mt-3">
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)} className="p-2 hover:bg-tech-gray-100 transition-colors"><Minus className="w-3 h-3" /></button>
                      <span className="font-mono text-xs tracking-widest px-3">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)} className="p-2 hover:bg-tech-gray-100 transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeItem(item.productId, item.size, item.color)} className="p-1 hover:opacity-60 transition-opacity"><X className="w-4 h-4" /></button>
                    <div className="font-mono text-xs tracking-widest">${(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border border-tech-gray-200 p-8 h-fit">
              <h2 className="font-mono text-xs tracking-widest mb-8">ORDER SUMMARY</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-mono text-xs tracking-widest">
                  <span className="text-tech-gray-500">SUBTOTAL</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono text-xs tracking-widest">
                  <span className="text-tech-gray-500">SHIPPING</span>
                  <span>CALCULATED AT CHECKOUT</span>
                </div>
              </div>
              <div className="border-t border-tech-gray-200 pt-4 mb-4">
                <div className="flex justify-between font-mono text-sm tracking-widest">
                  <span>TOTAL</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-tech-gray-500 tracking-wide mb-8">
                Each piece is made to order—cut, assembled, and finished specifically for you. Please allow time for production; thoughtful construction isn't rushed. Thank you for choosing Scale Mail and we'll get back to you confirming your order as soon as possible.
              </p>
              <button onClick={() => setShowForm(!showForm)} className="w-full bg-tech-black text-tech-white font-mono text-xs tracking-widest py-4 hover:bg-tech-gray-800 transition-colors">
                {showForm ? "CANCEL" : "ORDER VIA EMAIL"}
              </button>

              {showForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    await fetch("https://formsubmit.co/ajax/contact@scalemailstudio.com", { method: "POST", body: formData });
                    clearCart();
                    router.push("/store/thank-you?type=order");
                  }}
                  className="mt-6 space-y-4"
                >
                  <input type="hidden" name="_subject" value="New Order from Scale Mail" />
                  <input type="hidden" name="_captcha" value="false" />
                  <input type="hidden" name="message" value={fullMessage} />
                  {[
                    { name: "name", label: "NAME", type: "text", required: true, maxLength: 100, placeholder: "YOUR NAME" },
                    { name: "email", label: "EMAIL", type: "email", required: true, maxLength: 255, placeholder: "YOUR@EMAIL.COM" },
                  ].map(({ name, label, type, required, maxLength, placeholder }) => (
                    <div key={name}>
                      <label className="font-mono text-xs tracking-widest text-tech-gray-500 block mb-2">{label}</label>
                      <input type={type} name={name} required={required} maxLength={maxLength} placeholder={placeholder}
                        className="w-full font-mono text-xs tracking-widest border border-tech-gray-300 px-4 py-3 bg-transparent outline-none focus:border-tech-black transition-colors placeholder:text-tech-gray-400" />
                    </div>
                  ))}
                  <div>
                    <label className="font-mono text-xs tracking-widest text-tech-gray-500 block mb-2">NOTE (OPTIONAL)</label>
                    <textarea name="note" maxLength={500} rows={3} placeholder="ADD A NOTE TO YOUR ORDER..."
                      className="w-full font-mono text-xs tracking-widest border border-tech-gray-300 px-4 py-3 bg-transparent outline-none focus:border-tech-black transition-colors placeholder:text-tech-gray-400 resize-none" />
                  </div>
                  <div>
                    <label className="font-mono text-xs tracking-widest text-tech-gray-500 block mb-2">ORDER REQUEST FOR:</label>
                    <div className="w-full font-mono text-xs tracking-wide border border-tech-gray-200 bg-tech-gray-100 px-4 py-3 whitespace-pre-line text-tech-gray-600">
                      {orderMessage}{"\n"}TOTAL: USD {totalPrice.toLocaleString()}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-tech-black text-tech-white font-mono text-xs tracking-widest py-4 hover:bg-tech-gray-800 transition-colors">
                    SEND ORDER
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
