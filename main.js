require("dotenv").config();

const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.get("/media", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "media.html"));
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about.html"));
});
app.get("/shows", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "shows.html"));
});
app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "contact.html"));
});
app.get("/thanks", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "thanks.html"));
});

app.post("/contact", async (req, res) => {
  const { name, email, eventDate, venue, message, company } = req.body;

  // helpers
  const escape = (str = "") =>
    String(str).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

    const cleanEmail = (email || "").replace(/\r?\n|\r/g, "").trim();

    const trimmedName = (name || "").trim();
    const trimmedMessage = (message || "").trim();
    const trimmedVenue = (venue || "").trim();
    const trimmedEventDate = (eventDate || "").trim();

    const safeName = escape(trimmedName);
    const safeMessage = escape(trimmedMessage);
    const safeVenue = escape(trimmedVenue);

  // validation
  if (company) {
    return res.status(400).send("Spam detected");
  }

  if (!safeName || !cleanEmail || !safeMessage) {
  return res.status(400).send("Missing required fields");
}

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      replyTo: cleanEmail,
      to: process.env.EMAIL_USER,
      subject: `New Booking Inquiry from ${safeName}`,
      text: `
New Booking Inquiry

Name: ${safeName}
Email: ${cleanEmail}
Date: ${trimmedEventDate || "Not provided"}
Venue: ${safeVenue || "Not provided"}

Details:
${safeMessage}
`,
      html: `
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
  <h2>New Booking Inquiry</h2>
  <p><strong>Name:</strong> ${safeName}</p>
  <p><strong>Email:</strong> ${cleanEmail}</p>
  <p><strong>Date:</strong>${trimmedEventDate || "Not provided"}</p>
  <p><strong>Venue:</strong> ${safeVenue || "Not provided"}</p>
  <hr>
  <p><strong>Event Details:</strong></p>
  <p style="white-space: pre-line;">${safeMessage}</p>
</div>
`
    });

    console.log("Email sent from:", cleanEmail);
    res.redirect("/thanks");
  } catch (error) {
    console.error("Email send failed:", error);
    res.status(500).send("Something went wrong sending the email.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});