import "../styles/globals.css";
import { ApolloProvider } from "@apollo/client";
import client from "../lib/apollo";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Toaster } from "sonner";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

function MyApp({ Component, pageProps }) {
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
