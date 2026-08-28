export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, customerName, address, items, total, payMethod } = req.body;

    const itemsList = (items || [])
      .map((it) => `${it.product_name} x${it.quantity} - ₹${it.price * it.quantity}`)
      .join("\n");

    const emailBody = `
Naya order aaya FatafatKart par!

Order ID: ${orderId}
Customer: ${customerName}
Address: ${address}
Payment: ${payMethod}
Total: ₹${total}
Phone: ${phone}

Items:
${itemsList}
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FatafatKart <onboarding@resend.dev>",
        to: "rahulmourya227@gmail.com",
        subject: `Naya Order #${orderId} - FatafatKart`,
        text: emailBody,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      return res.status(500).json({ error: "Email send failed", details: errData });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
