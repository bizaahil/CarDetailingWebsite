// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Serve frontend (index.html, booknow.html, success.html, Assets folder, etc.)
app.use(express.static(path.join(__dirname, '..')));

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Health check route
app.get('/api', (req, res) => {
  res.send('Priority Wash booking API is running.');
});

// Booking route
app.post('/api/book', async (req, res) => {
  console.log("Incoming booking request:", req.body);

  const {
    name,
    phone,
    email,
    address,
    make,
    model,
    year,
    'vehicle-type': vehicleType,
    package: selectedPackage,
    date,
    time,
    notes
  } = req.body;

  // Required fields check
  if (!name || !phone || !email || !address) {
    return res.status(400).send('Missing required fields.');
  }

  // Build email HTML
  const htmlBody = `
    <h2>🚗 New Priority Wash Booking Request</h2>

    <h3>📞 Contact Info</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Address:</strong> ${address}</p>

    <h3>🚙 Vehicle Info</h3>
    <p><strong>Make:</strong> ${make || 'N/A'}</p>
    <p><strong>Model:</strong> ${model || 'N/A'}</p>
    <p><strong>Year:</strong> ${year || 'N/A'}</p>
    <p><strong>Type:</strong> ${vehicleType || 'N/A'}</p>

    <h3>🛠 Service Details</h3>
    <p><strong>Package:</strong> ${selectedPackage || 'N/A'}</p>
    <p><strong>Preferred Date:</strong> ${date || 'N/A'}</p>
    <p><strong>Preferred Time:</strong> ${time || 'N/A'}</p>

    <h3>📝 Additional Notes</h3>
    <p>${notes || 'None provided.'}</p>
  `;

  try {
    // Attempt email send
    const { data, error } = await resend.emails.send({
      from: 'Priority Wash <onboarding@resend.dev>',
      to: process.env.BOOKING_EMAIL_TO,
      subject: `New Booking Request from ${name}`,
      html: htmlBody,
    });

    if (error) {
      console.error("Resend Email Error:", error);
      return res.status(500).send("Email sending failed (Resend error).");
    }

    console.log("Booking email sent successfully:", data);

    // Redirect to clean success page
    res.redirect('/success.html');

  } catch (err) {
    console.error('Server error while sending email:', err);
    res.status(500).send('Something went wrong. Please try again later.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Priority Wash backend running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/index.html`);
});
