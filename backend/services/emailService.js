const nodemailer = require('nodemailer');

async function createTransport() {
  // If OAuth2 credentials are provided, prefer OAuth2 (recommended for Gmail)
  const hasOAuth = process.env.SMTP_OAUTH_CLIENT_ID && process.env.SMTP_OAUTH_CLIENT_SECRET && process.env.SMTP_OAUTH_REFRESH_TOKEN;
  if (hasOAuth) {
    const oauth2Config = {
      type: 'OAuth2',
      user: process.env.SMTP_USER,
      clientId: process.env.SMTP_OAUTH_CLIENT_ID,
      clientSecret: process.env.SMTP_OAUTH_CLIENT_SECRET,
      refreshToken: process.env.SMTP_OAUTH_REFRESH_TOKEN
    };

    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: oauth2Config
    });

    try {
      await transporter.verify();
    } catch (err) {
      console.warn('Mailer verify (OAuth2) failed:', err && err.message ? err.message : err);
    }
    return transporter;
  }

  // Fallback to classic SMTP user/pass
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465; // true for port 465 (SSL), false for others

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
  } catch (err) {
    console.warn('Mailer verify (SMTP) failed:', err && err.message ? err.message : err);
  }

  return transporter;
}

function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`;
}

function buildEmail(name, overdue, duesAmount) {
  const subject = `Library Dues Reminder — Total Due ${formatCurrency(duesAmount)}`;
  const intro = `Dear ${name},\n\nYou have overdue library items.`;
  const itemsText = overdue
    .map(b => {
      const daysLate = Math.ceil((Date.now() - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
      return `- "${b.title}" (Barcode: ${b.barcode}) — Due: ${new Date(b.dueDate).toDateString()} — ${daysLate} day(s) late`;
    })
    .join('\n');

  const text =
    `${intro}\n\n${itemsText}\n\nTotal dues: ${formatCurrency(duesAmount)}.\n` +
    `Please return overdue books and clear dues at the earliest.\n\nRegards,\nLibrary Team`;

  const htmlItems = overdue
    .map(b => {
      const daysLate = Math.ceil((Date.now() - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
      return `<li><strong>${b.title}</strong> (Barcode: ${b.barcode}) — Due: ${new Date(b.dueDate).toDateString()} — ${daysLate} day(s) late</li>`;
    })
    .join('');

  const html =
    `<p>Dear ${name},</p>` +
    `<p>You have overdue library items:</p>` +
    `<ul>${htmlItems}</ul>` +
    `<p><strong>Total dues:</strong> ${formatCurrency(duesAmount)}.</p>` +
    `<p>Please return overdue books and clear dues at the earliest.</p>` +
    `<p>Regards,<br/>Library Team</p>`;

  return { subject, text, html };
}

async function sendDuesEmail({ to, name, overdue, duesAmount }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const { subject, text, html } = buildEmail(name, overdue, duesAmount);

  const transporter = await createTransport();

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    return info;
  } catch (err) {
    // Add helpful guidance for common Gmail authentication errors
    const msg = err && err.message ? err.message : String(err);
    if (/535-5.7.8|Invalid login|BadCredentials/i.test(msg)) {
      console.error('SMTP authentication failed:', msg);
      console.error('Common fixes:');
      console.error('- If using Gmail, create an App Password and set it as SMTP_PASS (or use OAuth2).');
      console.error('- If you have 2FA enabled, you MUST use an App Password or OAuth2.');
      console.error('- Alternatively use a dedicated SMTP provider (SendGrid, Mailgun, etc.).');
    } else {
      console.error('Failed to send email:', msg);
    }
    throw err;
  }
}

// === BATCHED DUES EMAIL (Alternative: send all dues info in one email) ===
function buildBatchDuesReport(duesData) {
  // duesData = [ { name, email, overdue: [...], duesAmount }, ... ]
  const timestamp = new Date().toLocaleString();
  const subject = `Library Dues Report — ${timestamp}`;

  // Build text version
  let textReport = `LIBRARY DUES REPORT\n${timestamp}\n\n`;
  textReport += `Total students with overdue items: ${duesData.length}\n\n`;

  let totalDuesAmount = 0;
  duesData.forEach(({ name, email, overdue, duesAmount }, idx) => {
    totalDuesAmount += duesAmount;
    textReport += `${idx + 1}. ${name} (${email})\n`;
    textReport += `   Total Due: ₹${duesAmount.toFixed(2)}\n`;
    overdue.forEach(b => {
      const daysLate = Math.ceil((Date.now() - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
      textReport += `   - "${b.title}" (${b.barcode}) — ${daysLate} day(s) late\n`;
    });
    textReport += '\n';
  });
  textReport += `\nTotal Dues (All Students): ₹${totalDuesAmount.toFixed(2)}`;

  // Build HTML version
  let htmlReport = `<h2>Library Dues Report</h2><p><em>${timestamp}</em></p>`;
  htmlReport += `<p><strong>Total students with overdue items:</strong> ${duesData.length}</p>`;
  htmlReport += `<table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">`;
  htmlReport += `<tr><th>#</th><th>Student Name</th><th>Email</th><th>Total Due (₹)</th><th>Overdue Books</th></tr>`;

  duesData.forEach(({ name, email, overdue, duesAmount }, idx) => {
    const overdueList = overdue
      .map(b => {
        const daysLate = Math.ceil((Date.now() - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
        return `${b.title} (${b.barcode}) — ${daysLate} day(s) late`;
      })
      .join('<br/>');
    htmlReport += `<tr>`;
    htmlReport += `<td>${idx + 1}</td>`;
    htmlReport += `<td>${name}</td>`;
    htmlReport += `<td>${email}</td>`;
    htmlReport += `<td>₹${duesAmount.toFixed(2)}</td>`;
    htmlReport += `<td>${overdueList}</td>`;
    htmlReport += `</tr>`;
  });

  htmlReport += `</table>`;
  htmlReport += `<p><strong>Total Dues (All Students):</strong> ₹${totalDuesAmount.toFixed(2)}</p>`;

  return { subject, text: textReport, html: htmlReport };
}

async function sendBatchDuesReport(duesData) {
  // Send a single consolidated email with all dues info to admin/recipient
  // duesData: array of { name, email, overdue, duesAmount }
  if (!duesData || duesData.length === 0) {
    console.log('No overdue students; skipping batch dues email.');
    return;
  }

  const recipientEmail = process.env.BATCH_DUES_EMAIL || process.env.DEFAULT_DUE_EMAIL || process.env.SMTP_USER;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const { subject, text, html } = buildBatchDuesReport(duesData);

  // If MAIL_FAKE is set, write the HTML report to disk instead of sending
  if (process.env.MAIL_FAKE === 'true') {
    try {
      const outDir = path.join(__dirname, '..', 'json');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const filename = `dues-report-${Date.now()}.html`;
      const outPath = path.join(outDir, filename);
      const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${subject}</title></head><body>${html}</body></html>`;
      fs.writeFileSync(outPath, fullHtml, 'utf-8');
      console.log(`⚠️ MAIL_FAKE enabled — wrote batch dues report to ${outPath}`);
      return { message: 'mail-fake', path: outPath };
    } catch (err) {
      console.error('Failed to write fake batch dues report:', err && err.message ? err.message : err);
      throw err;
    }
  }

  const transporter = await createTransport();

  try {
    const info = await transporter.sendMail({
      from,
      to: recipientEmail,
      subject,
      text,
      html
    });
    console.log(`✓ Batch dues report sent to ${recipientEmail}. MessageId: ${info && info.messageId ? info.messageId : 'unknown'}`);
    return info;
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error(`Failed to send batch dues report to ${recipientEmail}:`, msg);
    if (/535-5.7.8|Invalid login|BadCredentials/i.test(msg)) {
      console.error('SMTP auth failed. Check SMTP_USER and SMTP_PASS in .env.');
    }
    throw err;
  }
}

module.exports = {
  sendDuesEmail,
  sendBatchDuesReport
};