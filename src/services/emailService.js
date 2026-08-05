// Verified Real World SMTP Email Dispatcher Service

export const getOwnerEmail = () => {
  return import.meta.env.VITE_OWNER_EMAIL || "hotel.aaradhya.dining@gmail.com";
};

// Verify SMTP Server Status
export const verifySmtpConnection = async () => {
  try {
    const res = await fetch('/api/verify-smtp');
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: 'SMTP Server offline (Run node server/index.js)' };
  }
};

// High-Aesthetic HTML Email Template Generator
export const generateEodHtmlTemplate = (reportData) => {
  const { date, totalRevenue, totalOrders, vegCount, nonVegCount, cashTotal, upiTotal, udharTotal, topDishes } = reportData;

  const topDishesHtml = topDishes.map((d, i) => `
    <tr style="border-bottom: 1px solid #332d27;">
      <td style="padding: 10px; font-weight: bold; color: #f59e0b;">#${i + 1}</td>
      <td style="padding: 10px; color: #f5f5f4; font-weight: 600;">${d.nameMr}</td>
      <td style="padding: 10px; color: #fbbf24; text-align: center; font-weight: bold;">${d.count} विक्री</td>
      <td style="padding: 10px; color: #34d399; text-align: right; font-weight: bold;">₹${d.revenue}</td>
    </tr>
  `).join('');

  const topDishesSection = topDishes.length > 0 ? `
    <h3 style="font-size: 14px; color: #fbbf24; margin: 15px 0 10px 0; font-weight: 800;">🏆 सर्वात जास्त विक्री झालेले पदार्थ (Top Dishes)</h3>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>क्र.</th>
            <th>पदार्थाचे नाव</th>
            <th style="text-align: center;">विक्री नग</th>
            <th style="text-align: right;">एकूण उत्पन्न</th>
          </tr>
        </thead>
        <tbody>
          ${topDishesHtml}
        </tbody>
      </table>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0c0a09; color: #f5f5f4; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #78350f; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #d97706, #ea580c, #b45309); padding: 25px; text-align: center; color: #0c0a09; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 5px 0 0 0; font-size: 13px; font-weight: 700; opacity: 0.9; }
    .content { padding: 25px; }
    .hero-stat { background: #0c0a09; border: 1px solid #b45309; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px; }
    .hero-stat .label { font-size: 12px; color: #a8a29e; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }
    .hero-stat .val { font-size: 32px; color: #fbbf24; font-weight: 900; margin-top: 5px; }
    .table-container { background: #0c0a09; border: 1px solid #44403c; border-radius: 14px; overflow: hidden; margin-top: 15px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #27272a; color: #fbbf24; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #78716c; border-top: 1px solid #27272a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚩 हॉटेल आराध्या डायनिंग</h1>
      <p>दैनिक विक्री व महसूल अहवाल (${date})</p>
    </div>

    <div class="content">
      
      <!-- Revenue Hero Card -->
      <div class="hero-stat">
        <div class="label">एकूण दैनिक जमा महसूल (Total Daily Revenue)</div>
        <div class="val">₹${totalRevenue}/-</div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="table-container" style="padding: 15px; margin-bottom: 20px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px; color: #a8a29e;">एकूण ऑर्डर्स संख्या:</td>
            <td style="padding: 8px; font-weight: bold; color: #fff; text-align: right;">${totalOrders} ऑर्डर्स</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #a8a29e;">शाकाहारी विक्री (Veg):</td>
            <td style="padding: 8px; font-weight: bold; color: #34d399; text-align: right;">🥗 ${vegCount} डिशेस</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #a8a29e;">मांसाहारी विक्री (Non-Veg):</td>
            <td style="padding: 8px; font-weight: bold; color: #f87171; text-align: right;">🍗 ${nonVegCount} डिशेस</td>
          </tr>
        </table>
      </div>

      <!-- Payment Method Breakup -->
      <h3 style="font-size: 14px; color: #fbbf24; margin: 0 0 10px 0; font-weight: 800;">💳 पेमेंट पद्धतीनुसार वर्गिकरण (Payment Breakup)</h3>
      <div class="table-container" style="margin-bottom: 20px;">
        <table>
          <thead>
            <tr>
              <th>पेमेंट प्रकार</th>
              <th style="text-align: right;">रक्कम</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 10px; color: #34d399; font-weight: bold;">💵 Cash (रोख पेमेंट)</td>
              <td style="padding: 10px; color: #34d399; font-weight: 800; text-align: right;">₹${cashTotal}/-</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 10px; color: #fbbf24; font-weight: bold;">📱 UPI (ऑनलाइन QR)</td>
              <td style="padding: 10px; color: #fbbf24; font-weight: 800; text-align: right;">₹${upiTotal}/-</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #f87171; font-weight: bold;">📝 Udhar (उधार नोंद)</td>
              <td style="padding: 10px; color: #f87171; font-weight: 800; text-align: right;">₹${udharTotal}/-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Top 5 Dishes Table -->
      ${topDishesSection}

    </div>

    <div class="footer">
      © ${new Date().getFullYear()} Hotel Aaradhya Dining POS System • Engineered for Culinary Operations.
    </div>
  </div>
</body>
</html>
  `;
};

// Plain Text fallback generator
export const generateEodReportText = (reportData) => {
  const { date, totalRevenue, totalOrders, vegCount, nonVegCount, cashTotal, upiTotal, udharTotal, topDishes } = reportData;
  const topDishesText = topDishes.map((d, i) => `${i + 1}. ${d.nameMr} (${d.count} विक्री - ₹${d.revenue})`).join('\n');

  return `🚩 HOTEL AARADHYA DINING - DAILY EOD SALES REPORT 🚩
तारीख: ${date}

=========================================
📊 दैनिक विक्री सारांश (DAILY SALES SUMMARY):
=========================================
• एकूण दैनिक महसूल (Total Revenue): ₹${totalRevenue}/-
• एकूण पूर्ण झालेल्या ऑर्डर्स: ${totalOrders}

🍲 जेवण प्रकार वर्गीकरण (VEG vs NON-VEG):
• शाकाहारी विक्री (Veg Thalis/Dishes): ${vegCount}
• मांसाहारी विक्री (Non-Veg Thalis/Dishes): ${nonVegCount}

💵 पेमेंट पद्धतीनुसार वर्गीकरण (PAYMENT BREAKUP):
• रोख पेमेंट (Cash Collected): ₹${cashTotal}/-
• UPI पेमेंट (UPI Received): ₹${upiTotal}/-
• उधारी नोंद (Pending Udhar Credit): ₹${udharTotal}/-

🏆 टॉप ५ लोकप्रिय पदार्थ (TOP SELLING DISHES):
${topDishesText || 'नाही'}

=========================================
हॉटेल आराध्या डायनिंग POS प्रणाली द्वारे स्वयं-निर्मित अहवाल.
=========================================`;
};

// Dispatch Verified Email via Express SMTP Server
export const sendEodReportEmail = async (reportData, ownerEmailOverride = null) => {
  const targetEmail = ownerEmailOverride || getOwnerEmail();
  const htmlContent = generateEodHtmlTemplate(reportData);
  const plainTextContent = generateEodReportText(reportData);

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: targetEmail,
        subject: `🚩 [हॉटेल आराध्या] दैनिक विक्री अहवाल - ${reportData.date}`,
        htmlBody: htmlContent,
        textBody: plainTextContent
      })
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, message: "✅ Verified Real World SMTP Email Sent Successfully!" };
    } else {
      console.warn("SMTP API Server response warning:", data);
    }
  } catch (err) {
    console.warn("Express SMTP Server connection error:", err);
  }

  // Direct Mailto Fallback
  const subject = encodeURIComponent(`🚩 [हॉटेल आराध्या] दैनिक विक्री अहवाल - ${reportData.date}`);
  const body = encodeURIComponent(plainTextContent);
  const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

  return {
    success: true,
    isMailtoFallback: true,
    mailtoUrl,
    htmlContent,
    reportText: plainTextContent
  };
};
