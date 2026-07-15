const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function notifyAgent(phoneNumber, message) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.AGENT_EMAIL,
            subject: 'Transfert client WhatsApp — Action requise',
            html: `
                <div style="font-family:Arial;max-width:600px;margin:0 auto">
                    <h2 style="color:#128C7E">Nouveau transfert client</h2>
                    <p>Un client demande a parler a un agent humain.</p>
                    <table style="width:100%;border-collapse:collapse">
                        <tr>
                            <td style="padding:10px;background:#f5f5f5;font-weight:bold">Numero client</td>
                            <td style="padding:10px">+${phoneNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px;background:#f5f5f5;font-weight:bold">Message</td>
                            <td style="padding:10px">${message}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px;background:#f5f5f5;font-weight:bold">Heure</td>
                            <td style="padding:10px">${new Date().toLocaleString('fr-FR')}</td>
                        </tr>
                    </table>
                    <p style="margin-top:20px">
                        <a href="https://wa.me/${phoneNumber}" 
                           style="background:#25D366;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">
                            Repondre sur WhatsApp
                        </a>
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email de transfert envoye a ' + process.env.AGENT_EMAIL);
        return true;

    } catch (error) {
        console.error('Erreur envoi email:', error.message);
        return false;
    }
}

module.exports = { notifyAgent };