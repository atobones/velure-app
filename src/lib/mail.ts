import nodemailer from "nodemailer";

const transport =
  process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "smtp.gmail.com",
        // Hetzner blocks port 465
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        requireTLS: true,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

export async function sendLoginCode(to: string, code: string) {
  const subject = `${code} — Twój kod do Veluré Café`;
  const text = `Twój kod do karty Veluré Café: ${code}\n\nKod jest ważny 10 minut. Jeśli to nie Ty, zignoruj tę wiadomość.\n\nVeluré Café · Erazma Ciołka 25, Warszawa`;
  const html = `<div style="font-family:Arial,sans-serif;background:#FAF2E7;padding:32px;color:#2E2520">
  <p style="font-size:15px;margin:0 0 12px">Twój kod do karty Veluré Café:</p>
  <p style="font-size:36px;letter-spacing:8px;font-weight:600;margin:0 0 16px">${code}</p>
  <p style="font-size:14px;color:#6A5F57;margin:0">Kod jest ważny 10 minut. Jeśli to nie Ty, zignoruj tę wiadomość.</p>
  <p style="font-size:13px;color:#6A5F57;margin:24px 0 0">Veluré Café · Erazma Ciołka 25, Warszawa</p></div>`;
  if (!transport) {
    // Dev: print the code
    if (process.env.NODE_ENV !== "production") return console.log(`[dev] login code for ${to}: ${code}`);
    throw new Error("SMTP not configured");
  }
  await transport.sendMail({ from: `"Veluré Café" <${process.env.SMTP_USER}>`, to, subject, text, html });
}
