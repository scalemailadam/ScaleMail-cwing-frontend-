const PAYPAL_API = "https://api-m.paypal.com";

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { items, shipping = 15 } = req.body;

  // Server-side stock validation
  if (process.env.NEXT_PUBLIC_STRAPI_URL && process.env.STRAPI_API_TOKEN) {
    const strapiBase = process.env.NEXT_PUBLIC_STRAPI_URL;
    const headers = { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` };
    for (const item of items) {
      try {
        const r = await fetch(`${strapiBase}/api/products/${item.productId}?fields=quantity`, { headers });
        const { data } = await r.json();
        const stock = data?.quantity;
        if (stock !== null && stock !== undefined && item.quantity > stock) {
          return res.status(400).json({ error: `${item.code} only has ${stock} in stock`, outOfStock: true });
        }
      } catch (_) {}
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shipping;

  try {
    const accessToken = await getAccessToken();

    const order = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
              breakdown: {
                item_total: { currency_code: "USD", value: subtotal.toFixed(2) },
                shipping: { currency_code: "USD", value: shipping.toFixed(2) },
              },
            },
            items: items.map((item) => ({
              name: `${item.code} — ${item.color} / ${item.size}`,
              quantity: String(item.quantity),
              unit_amount: { currency_code: "USD", value: item.price.toFixed(2) },
            })),
          },
        ],
      }),
    });

    const orderData = await order.json();
    res.status(200).json({ orderID: orderData.id });
  } catch (err) {
    console.error("PayPal create order error:", err);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
}
