const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

// Opciones de configuración para SendGrid
const options = {
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
};

// Creamos el "transportador" de correos
const mailer = nodemailer.createTransport(sgTransport(options));

/**
 * Función para enviar un email.
 * @param {string} to - El destinatario del correo.
 * @param {string} subject - El asunto del correo.
 * @param {string} html - El contenido del correo en formato HTML.
 */
const sendEmail = async (to, subject, html) => {
    const email = {
        to: to,
        from: process.env.EMAIL_FROM, // El email que verificaste en SendGrid
        subject: subject,
        html: html,
    };

    try {
        await mailer.sendMail(email);
        console.log(`Correo enviado exitosamente a ${to}`);
    } catch (error) {
        console.error('Error al enviar el correo:', error);
    }
};

module.exports = sendEmail;