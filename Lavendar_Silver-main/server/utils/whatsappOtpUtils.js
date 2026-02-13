const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

if (!accountSid || !authToken || !whatsappFrom) {
    console.warn('Twilio WhatsApp credentials are not fully set in environment variables.');
}

const client = twilio(accountSid, authToken);

async function sendWhatsAppMessage(to, message) {
    if (!accountSid || !authToken || !whatsappFrom) {
        throw new Error('Twilio WhatsApp credentials are not configured.');
    }
    try {
        const msg = await client.messages.create({
            from: whatsappFrom,
            to: to,
            body: message,
        });
        return msg.sid;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}

async function sendOtp(to) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const message = `Your OTP code is: ${otp}. It is valid for 5 minutes.`;

    await sendWhatsAppMessage(to, message);

    return otp;
}

module.exports = {
    sendWhatsAppMessage,
    sendOtp,
};


// other solution 
// const axios = require('axios');

// const WHATSAPP_TOKEN = 'your_facebook_access_token';
// const PHONE_NUMBER_ID = 'your_whatsapp_phone_number_id';

// async function sendWhatsAppMessage(to, message) {
//   const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

//   const payload = {
//     messaging_product: 'whatsapp',
//     to: to, // format: 91xxxxxxxxxx
//     type: 'text',
//     text: { body: message },
//   };

//   try {
//     const res = await axios.post(url, payload, {
//       headers: {
//         Authorization: `Bearer ${WHATSAPP_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//     });
//     return res.data;
//   } catch (error) {
//     console.error('Error sending message via Facebook Cloud API:', error.response?.data || error);
//     throw error;
//   }
// }

