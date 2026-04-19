import "../styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { ApolloProvider } from "@apollo/client";
import client from "../lib/apollo";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Toaster } from "sonner";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (router.pathname.startsWith("/store")) {
      document.body.classList.add("store-page");
    } else {
      document.body.classList.remove("store-page");
    }
  }, [router.pathname]);

  return (
    <ApolloProvider client={client}>
      <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, currency: "USD" }}>
        <CartProvider>
          <ThemeProvider>
            <Toaster />
            <Component {...pageProps} />
          </ThemeProvider>
        </CartProvider>
      </PayPalScriptProvider>
    </ApolloProvider>
  );
}

export default MyApp;
