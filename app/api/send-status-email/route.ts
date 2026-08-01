import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, fullName, status, email, grandTotal } = body;

    if (!email) {
      return NextResponse.json({ message: "No email provided for customer. Skipping step." }, { status: 200 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Dynamic status descriptions for premium customer transparency
    const statusMap: Record<string, { title: string; desc: string; color: string }> = {
      pending: { title: "Awaiting Clearance", desc: "Your order ledger has been logged. We are awaiting manual confirmation of funds transfer.", color: "#c4a174" },
      prcoessing: { title: "In Production / Packing", desc: "Your transaction cleared successfully! Our workspace is carefully packing your design assets now.", color: "#2b2652" },
      onhold: { title: "Temporary Hold", desc: "Your package delivery status is paused momentarily. Our fulfillment team will connect with you.", color: "#ea580c" },
      confirmed: { title: "Dispatched & Completed", desc: "Excellent news. Your registry shipment has completed processing and is currently dispatched.", color: "#10b981" },
      Cancelled: { title: "Registry Cancelled", desc: "This order archive has been marked as cancelled. Any processed settlement balances will drop back shortly.", color: "#ef4444" },
      refunded: { title: "Funds Reverted", desc: "A financial rollback was initiated. The transaction balance has been fully refunded.", color: "#64748b" },
    };

    const currentStatus = statusMap[status] || { title: status.toUpperCase(), desc: "Your transaction tracking status has shifted.", color: "#2b2652" };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 40px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        <table role="presentation" max-width="600" align="center" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 20px 40px rgba(0,0,0,0.02);">
          <tr>
            <td style="background-color: #2b2652; padding: 40px; text-align: center;">
              <div style="font-size: 10px; font-weight: 900; color: #c4a174; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 8px;">Bangalore Collective</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em;">Status Update Statement</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 14px; color: #64748b; margin-top: 0;">Hello <strong>${fullName.toUpperCase()}</strong>,</p>
              <p style="font-size: 14px; color: #1e293b; line-height: 1.6;">Your order status for ledger entry <strong>#ORD-${orderId}</strong> has changed:</p>
              
              <div style="background-color: #fbfbfc; border-left: 4px solid ${currentStatus.color}; padding: 20px; margin: 24px 0; border-radius: 12px;">
                <span style="font-size: 10px; font-weight: 900; color: ${currentStatus.color}; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Current Stage</span>
                <span style="font-size: 18px; font-weight: 900; color: #2b2652;">${currentStatus.title}</span>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">${currentStatus.desc}</p>
              </div>

              <table role="presentation" width="100%" style="margin-bottom: 24px; font-size: 13px; color: #64748b;">
                <tr>
                  <td style="padding: 6px 0;">Order Value:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #1e293b;">₹${Number(grandTotal).toLocaleString('en-IN')}</td>
                </tr>
              </table>

              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center;">If you have query alignments, contact support utilizing your dynamic core identification key (#ORD-${orderId}).</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Bangalore Collective" <${process.env.EMAIL_USER}>`,
      to: email, // Dispatches directly to the customer's email address
      subject: `📦 Update: Order #ORD-${orderId} is now ${currentStatus.title}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Status email failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}