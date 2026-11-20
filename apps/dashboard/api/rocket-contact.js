const subjects = new Map([
  ["contact", "Rocket Kit contact enquiry"],
  ["access", "Rocket Kit access request"],
  ["demo", "Rocket Kit demo request"]
]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST to send a message." });
  }

  const { name, email, message, intent, website } = req.body || {};
  if (website) return res.status(200).json({ ok: true });
  const subject = subjects.get(intent);
  if (!subject || typeof name !== "string" || !name.trim() || name.length > 120
    || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || typeof message !== "string" || !message.trim() || message.length > 4000) {
    return res.status(400).json({ error: "Enter your name, email and a message of up to 4,000 characters." });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.ROCKET_CONTACT_FROM;
  if (!key || !from) return res.status(503).json({ error: "The contact form is temporarily unavailable. Please try again later." });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from,
        to: ["admin@rocketkit.in"],
        reply_to: email,
        subject,
        text: [`Name: ${name.trim()}`, `Email: ${email}`, "", message.trim()].join("\n")
      })
    });
    if (response.ok) return res.status(200).json({ ok: true });
    console.error("Rocket contact delivery failed", response.status);
  } catch (error) {
    console.error("Rocket contact delivery failed", error.name);
  }
  return res.status(502).json({ error: "Your message could not be sent. Please try again." });
}
