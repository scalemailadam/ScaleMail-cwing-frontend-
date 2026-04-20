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

  const { orderID, items, shipping, customerInfo } = req.body;

  try {
    const accessToken = await getAccessToken();

    const capture = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const captureData = await capture.json();

    if (captureData.status !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed", details: captureData });
    }

    // Post-capture stock check — refund if someone else bought the last item first
    if (process.env.NEXT_PUBLIC_STRAPI_URL && process.env.STRAPI_API_TOKEN) {
      const strapiBase = process.env.NEXT_PUBLIC_STRAPI_URL;
      const strapiHeaders = {
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
        "Content-Type": "application/json",
      };
      const oversoldItems = [];
      await Promise.allSettled(
        items.map(async (item) => {
          try {
            const r = await fetch(`${strapiBase}/api/products/${item.productId}?fields=quantity`, { headers: strapiHeaders });
            const { data } = await r.json();
            const stock = data?.quantity;
            if (stock !== null && stock !== undefined && item.quantity > stock) {
              oversoldItems.push(item.code);
            }
          } catch (_) {}
        })
      );

      if (oversoldItems.length > 0) {
        // Issue full refund
        const refundAccessToken = await getAccessToken();
        const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
        if (captureId) {
          await fetch(`${PAYPAL_API}/v2/payments/captures/${captureId}/refund`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${refundAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          });
        }
        return res.status(409).json({
          error: `Sorry, ${oversoldItems.join(", ")} just sold out. You have been fully refunded.`,
          oversold: true,
        });
      }
    }

    // Send confirmation email via Resend if API key is set
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const orderLines = items
        .map((item) => `${item.code} — ${item.name} / ${item.color} / ${item.size} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`)
        .join("\n");

      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const total = subtotal + (shipping || 15);

      await resend.emails.send({
        from: "orders@scalemailstudio.com",
        to: "contact@scalemailstudio.com",
        subject: `New Order — ${customerInfo?.name || "Customer"}`,
        text: `NEW ORDER RECEIVED\n\nCustomer: ${customerInfo?.name}\nEmail: ${customerInfo?.email}\n\nShip to:\n${customerInfo?.address}\n${customerInfo?.city}, ${customerInfo?.zip}\n${customerInfo?.country}\n\nItems:\n${orderLines}\n\nSubtotal: $${subtotal.toFixed(2)}\nShipping: $${(shipping || 15).toFixed(2)}\nTotal: $${total.toFixed(2)}\n\nPayPal Order ID: ${orderID}`,
      });
    }

    // Decrement stock for each purchased item
    if (process.env.STRAPI_API_TOKEN && process.env.NEXT_PUBLIC_STRAPI_URL) {
      await Promise.allSettled(
        items.map(async (item) => {
          try {
            const strapiBase = process.env.NEXT_PUBLIC_STRAPI_URL;
            const headers = {
              Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
              "Content-Type": "application/json",
            };
            const getRes = await fetch(`${strapiBase}/api/products/${item.productId}?fields=quantity`, { headers });
            const { data } = await getRes.json();
            const current = data?.quantity;
            if (current === null || current === undefined) return; // unlimited stock, skip
            const updated = Math.max(0, current - item.quantity);
            await fetch(`${strapiBase}/api/products/${item.productId}`, {
              method: "PUT",
              headers,
              body: JSON.stringify({ data: { quantity: updated } }),
            });
          } catch (e) {
            console.error(`Failed to decrement stock for ${item.productId}:`, e);
          }
        })
      );
    }

    res.status(200).json({ status: "COMPLETED", orderID });
  } catch (err) {
    console.error("PayPal capture error:", err);
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
}
