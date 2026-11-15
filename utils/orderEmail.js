
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOrderEmail = async (order) => {
  const items = (order.items || [])
    .map((item) => {
      const name =
        item.productId?.name ||
        item.name ||
        "Product";

      const price =
        Number(item.productId?.price || item.price || 0);

      const quantity = Number(item.quantity || 1);

      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            ${name}
          </td>
          <td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">
            ${quantity}
          </td>
          <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">
            $${(price * quantity).toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join("");

  const total = order.items.reduce((sum, item) => {
    const price = Number(
      item.productId?.price || item.price || 0
    );

    return sum + price * Number(item.quantity || 1);
  }, 0);

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>

  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">

    <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;">

      <div style="background:#111827;padding:30px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:25px;letter-spacing:2px;">
          YOUR STORE
        </h1>
        <p style="margin:10px 0 0;color:#d1d5db;">
          ORDER CONFIRMATION
        </p>
      </div>

      <div style="padding:35px 25px;text-align:center;">

        <div style="font-size:45px;color:#16a34a;">✓</div>

        <h1 style="color:#111827;margin-bottom:10px;">
          Thank You for Your Order!
        </h1>

        <p style="color:#666;line-height:1.7;">
          Hello ${order.customerName},
          <br><br>
          Your order has been successfully placed.
          We are excited to prepare your items and get
          them ready for delivery.
        </p>

        <div style="background:#f9fafb;padding:18px;border-radius:8px;margin:25px 0;text-align:left;">

          <p style="margin:5px 0;color:#555;">
            <strong>Order ID:</strong>
            ${order._id}
          </p>

          <p style="margin:5px 0;color:#555;">
            <strong>Status:</strong> Pending
          </p>

          <p style="margin:5px 0;color:#555;">
            <strong>Customer:</strong>
            ${order.customerName}
          </p>

        </div>

        <h3 style="text-align:left;color:#111827;">
          Your Order Details
        </h3>

        <table style="width:100%;border-collapse:collapse;color:#444;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:12px;text-align:left;">Product</th>
              <th style="padding:12px;">Qty</th>
              <th style="padding:12px;text-align:right;">Price</th>
            </tr>
          </thead>

          <tbody>
            ${items}
          </tbody>
        </table>

        <div style="text-align:right;padding:20px 5px;">
          <h2 style="color:#111827;">
            Total: $${total.toFixed(2)}
          </h2>
        </div>

        <div style="background:#111827;padding:18px;border-radius:8px;color:white;">
          <h3 style="margin:0 0 8px;">
            We Appreciate Your Trust!
          </h3>

          <p style="margin:0;color:#d1d5db;line-height:1.6;">
            Thank you for shopping with us.
            We look forward to serving you again.
          </p>
        </div>

      </div>

      <div style="background:#f9fafb;padding:20px;text-align:center;color:#999;font-size:12px;">
        <p>Thank you for choosing YOUR STORE.</p>
        <p>© ${new Date().getFullYear()} YOUR STORE. All rights reserved.</p>
      </div>

    </div>

  </body>
  </html>
  `;

  return transporter.sendMail({
    from: `"YOUR STORE" <${process.env.EMAIL_USER}>`,
    to: order.customerEmail,
    subject: "Your Order Has Been Successfully Placed!",
    html,
    text: `Hello ${order.customerName}, your order has been successfully placed. Order ID: ${order._id}`,
  });
};

module.exports = sendOrderEmail;
