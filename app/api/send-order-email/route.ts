import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface CartItem {
  id?: number;
  productId?: number;
  name: string;
  variationName?: string;
  variation_name?: string;
  quantity: number;
  price: number;
  image?: string;
  sku?: string;
}

function getVariationLabel(item: CartItem): string {
  return item.variationName || item.variation_name || "Standard";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      fullName,
      phone,
      city,
      paymentMethod,
      grandTotal,
      email,

      // Optional extras — pass these in from checkout/admin for the full breakdown.
      // The email will still work fine without them (it just hides those sections).
      cartItems,            // CartItem[]
      houseNumber,
      street,
      state,
      pincode,
      totalPrice,           // subtotal before GST/shipping
      shippingCost,
    } = body;

    // 1. Configure the SMTP transporter using your environment variables
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const items: CartItem[] = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = Number(totalPrice ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const gstAmount = subtotal * 0.18;
    const shipping = Number(shippingCost ?? 0);

    // 2. Build the line-items table rows (only rendered if items exist)
    // Table-based (not flex) row markup — Outlook / Gmail Android / many mobile
    // mail clients ignore `display: flex` inside emails, so nested <table> is
    // used here for the image + name/sku block to keep this aligned on mobile.
    const itemsRowsHtml = items.map((item) => `
      <tr>
        <td style="padding: 14px 8px 14px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 800; color: #2b2652;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              ${item.image ? `<td width="44" valign="top" style="padding-right: 12px;"><img src="${item.image}" width="44" height="44" style="border-radius: 10px; object-fit: cover; display: block;" /></td>` : ""}
              <td valign="middle">
                <div>${item.name}</div>
                <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">
                  SKU: ${item.sku || "N/A"} &nbsp;•&nbsp; ${getVariationLabel(item)}
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 800; color: #2b2652; text-align: center; white-space: nowrap;">
          ${item.quantity}
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 700; color: #64748b; text-align: right; white-space: nowrap;">
          ₹${item.price.toLocaleString("en-IN")}
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 900; color: #2b2652; text-align: right; white-space: nowrap;">
          ₹${(item.price * item.quantity).toLocaleString("en-IN")}
        </td>
      </tr>
    `).join("");

    const itemsTableHtml = items.length > 0 ? `
      <h3 style="margin: 0 0 16px 0; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em;">
        Manifest Items
      </h3>
      <div style="width: 100%; overflow-x: auto;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; min-width: 360px;">
        <thead>
          <tr>
            <th align="left" style="padding-bottom: 10px; font-size: 9px; font-weight: 900; color: #c4a174; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 2px solid #f1f5f9;">Item</th>
            <th align="center" style="padding-bottom: 10px; font-size: 9px; font-weight: 900; color: #c4a174; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 2px solid #f1f5f9;">Qty</th>
            <th align="right" style="padding-bottom: 10px; font-size: 9px; font-weight: 900; color: #c4a174; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 2px solid #f1f5f9;">Unit Price</th>
            <th align="right" style="padding-bottom: 10px; font-size: 9px; font-weight: 900; color: #c4a174; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 2px solid #f1f5f9;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>
      </div>

      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
        <tr>
          <td class="totals-cell" style="width: 100%;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="totals-box" style="max-width: 260px; margin-left: auto; background-color: #fbfbfc; border: 1px solid #f1f5f9; border-radius: 18px; padding: 18px;">
              <tr>
                <td style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 0;">Subtotal</td>
                <td style="font-size: 11px; font-weight: 900; color: #2b2652; text-align: right; padding: 4px 0;">₹${subtotal.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 0;">GST (18%)</td>
                <td style="font-size: 11px; font-weight: 900; color: #2b2652; text-align: right; padding: 4px 0;">+ ₹${gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 0;">Shipping</td>
                <td style="font-size: 11px; font-weight: 900; color: #2b2652; text-align: right; padding: 4px 0;">₹${shipping.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; font-weight: 900; color: #c4a174; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 0 0 0; border-top: 1px solid #e2e8f0;">Grand Total</td>
                <td style="font-size: 16px; font-weight: 900; color: #2b2652; text-align: right; padding: 10px 0 0 0; border-top: 1px solid #e2e8f0;">₹${Number(grandTotal).toLocaleString("en-IN")}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    ` : "";

    // 3. Shipping address block (only rendered if address fields are passed)
    const addressHtml = (houseNumber || street || city || state || pincode) ? `
      <h3 style="margin: 0 0 16px 0; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em;">
        Destination
      </h3>
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fbfbfc; border: 1px solid #f1f5f9; border-radius: 18px; padding: 18px; margin-bottom: 40px;">
        <tr>
          <td style="font-size: 12px; font-weight: 700; color: #2b2652; line-height: 1.6;">
            ${[houseNumber, street].filter(Boolean).join(", ")}<br />
            ${[city, state].filter(Boolean).join(", ")}<br />
            ${pincode ? `PIN: ${pincode}` : ""}
          </td>
        </tr>
      </table>
    ` : "";

    // 4. Build the full HTML email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Dispatch Archive</title>
        <style>
          @media only screen and (max-width: 600px) {
            .email-outer { border-radius: 20px !important; }
            .email-header { padding: 28px 22px !important; }
            .email-header h1 { font-size: 20px !important; }
            .email-body-cell { padding: 22px !important; }
            .grand-box { padding: 16px !important; }
            .grand-box .amount { font-size: 24px !important; }
            .totals-box { max-width: 100% !important; }
            .footer-cell { padding: 0 22px 28px 22px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 40px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

        <table role="presentation" max-width="600" align="center" border="0" cellpadding="0" cellspacing="0" class="email-outer" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 20px 40px rgba(43, 38, 82, 0.04); border: 1px solid #f1f5f9;">

          <tr>
            <td class="email-header" style="background: linear-gradient(135deg, #2b2652 0%, #1a1733 100%); padding: 40px; text-align: center; position: relative;">
              <div style="font-size: 10px; font-weight: 900; color: #c4a174; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 8px;">
                System Engine Archive
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em;">
                New Order <span style="color: #c4a174; font-style: italic; font-weight: 300;">Captured</span>
              </h1>
            </td>
          </tr>

          <tr>
            <td class="email-body-cell" style="padding: 40px;">

              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="grand-box" style="background-color: #fbfbfc; border: 1px solid #f1f5f9; border-radius: 24px; padding: 24px; margin-bottom: 32px;">
                <tr>
                  <td>
                    <span style="font-size: 9px; font-weight: 900; color: #c4a174; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 4px;">
                      Grand Valuation
                    </span>
                    <span class="amount" style="font-size: 32px; font-weight: 900; color: #2b2652; letter-spacing: -0.04em;">
                      ₹${Number(grandTotal).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td align="right" style="vertical-align: bottom;">
                    <span style="display: inline-block; padding: 6px 14px; background-color: #2b2652; color: #ffffff; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 10px; white-space: nowrap;">
                      ${paymentMethod}
                    </span>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 0 0 16px 0; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em;">
                Entity Records
              </h3>

              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">

                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; width: 35%;">
                    Order Reference
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; font-weight: 900; color: #2b2652; font-family: monospace;">
                    ${orderId}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
                    Customer Profile
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; font-weight: 800; color: #2b2652; text-transform: uppercase;">
                    ${fullName}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
                    Contact Number
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; font-weight: 700; color: #2b2652;">
                    ${phone}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
                    User Email
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; font-weight: 700; color: #2b2652;">
                    ${email || 'N/A'}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 14px 0; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
                    Destination City
                  </td>
                  <td style="padding: 14px 0; font-size: 13px; font-weight: 800; color: #2b2652; text-transform: uppercase;">
                    ${city}
                  </td>
                </tr>

              </table>

              ${itemsTableHtml}

              ${addressHtml}

            </td>
          </tr>

          <tr>
            <td class="footer-cell" style="padding: 0 40px 40px 40px; text-align: center;">
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 0 0 24px 0;" />
              <p style="margin: 0; font-size: 10px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.15em;">
                Automated Transaction Registry • Bangalore Collective
              </p>
            </td>
          </tr>

        </table>

      </body>
      </html>
    `;

    // 5. Send email to your login/admin address
    await transporter.sendMail({
      from: `"Store Engine" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `🚨 [New Order] ₹${Number(grandTotal).toLocaleString('en-IN')} — ${fullName.toUpperCase()}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}