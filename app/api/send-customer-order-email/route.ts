import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const {
      orderId,
      fullName,
      email,
      grandTotal,
      paymentMethod,
    } = await request.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:40px;background:#f8fafc;font-family:Arial,sans-serif;">

        <table align="center" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;padding:40px;">
          
          <tr>
            <td align="center">
              <h1 style="color:#2b2652;">
                Thank You For Your Order ❤️
              </h1>

              <p style="font-size:15px;color:#475569;">
                Hi <strong>${fullName}</strong>,
              </p>

              <p style="font-size:15px;color:#475569;">
                Your order has been placed successfully.
              </p>
            </td>
          </tr>

          <tr>
            <td>
              <div style="background:#f8fafc;padding:20px;border-radius:16px;margin-top:20px;">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Total Amount:</strong> ₹${Number(grandTotal).toLocaleString("en-IN")}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding-top:25px;">
              <p style="color:#64748b;">
                We have received your payment proof and our team will verify it shortly.
              </p>

              <p style="color:#64748b;">
                Once approved, your order will move to processing.
              </p>

              <p style="margin-top:30px;">
                Thank you for shopping with us.
              </p>

              <strong>Bangalore Collective Team</strong>
            </td>
          </tr>

        </table>

      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Bangalore Collective" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmation #${orderId}`,
      html: customerHtml,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}