import "../styles/globals.css";
import { ApolloProvider } from "@apollo/client";
import client from "../lib/apollo";
import { CartProvider } from "../context/CartContext";
import { Toaster } from "sonner";

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <CartProvider>
        <Toaster />
        <Component {...pageProps} />
      </CartProvider>
    </ApolloProvider>
  );
}

export default MyApp;
