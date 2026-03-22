import { useState } from "react";
import { useRouter } from "next/router";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";

export default function ContactPage() {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-tech-white flex flex-col">
      <StoreHeader sortOrder={sortOrder} onSortChange={setSortOrder} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <h1 className="font-mono text-sm tracking-widest mb-2">CONTACT US</h1>
          <p className="font-mono text-xs text-tech-gray-500 tracking-wide mb-8">Get in touch — we&apos;d love to hear from you.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await fetch("https://formsubmit.co/ajax/contact@scalemailstudio.com", { method: "POST", body: formData });
              router.push("/store/thank-you?type=contact");
            }}
            className="space-y-6"
          >
            <input type="hidden" name="_subject" value="New Contact from Scale Mail" />
            <input type="hidden" name="_captcha" value="false" />
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
              <label className="font-mono text-xs tracking-widest text-tech-gray-500 block mb-2">MESSAGE</label>
              <textarea name="message" required maxLength={2000} rows={5} placeholder="HOW CAN WE HELP?"
                className="w-full font-mono text-xs tracking-widest border border-tech-gray-300 px-4 py-3 bg-transparent outline-none focus:border-tech-black transition-colors placeholder:text-tech-gray-400 resize-none" />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="mailing_list" value="yes" className="mt-0.5 accent-tech-black" />
              <span className="font-mono text-xs text-tech-gray-500 tracking-wide leading-relaxed">
                Subscribe to our mailing list for new drops and exclusive access
              </span>
            </label>
            <button type="submit" className="w-full bg-tech-black text-tech-white font-mono text-xs tracking-widest py-4 hover:bg-tech-gray-800 transition-colors">
              SEND MESSAGE
            </button>
          </form>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
