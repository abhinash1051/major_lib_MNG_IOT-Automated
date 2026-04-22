require('dotenv').config();
const { sendDuesEmail } = require('./services/emailService');

async function run() {
    try {
        const toCli = process.argv[2]; // new: allow passing recipient via CLI
        const info = await sendDuesEmail({
            to: toCli || process.env.DEFAULT_DUE_EMAIL || process.env.SMTP_USER,
            name: 'Test User',
            overdue: [
                { title: 'Test Book', barcode: 'TB-001', dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            duesAmount: 30
        });
        console.log('Email sent successfully:', info && info.messageId ? info.messageId : info);
    } catch (err) {
        console.error('Email send failed:', err && err.message ? err.message : err);
        process.exitCode = 1;
    }
}

run();