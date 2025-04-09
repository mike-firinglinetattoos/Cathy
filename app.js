// app.js

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.use(bodyParser.json());

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle messages and postbacks
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];
      const senderPsid = webhookEvent.sender.id;

      if (webhookEvent.message) {
        await handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        await handlePostback(senderPsid, webhookEvent.postback);
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Handles messages
async function handleMessage(senderPsid, receivedMessage) {
  const text = receivedMessage.text?.toLowerCase() || '';

  if (text.includes('start') || text.includes('hi') || text.includes('hello')) {
    const response = {
      text: "Hey there! 👋 What are you interested in?",
      quick_replies: [
        { content_type: "text", title: "Tattoos", payload: "TATTOOS" },
        { content_type: "text", title: "Piercings", payload: "PIERCINGS" },
        { content_type: "text", title: "Jagua Tattoos", payload: "JAGUA" },
        { content_type: "text", title: "Face Painting", payload: "FACEPAINT" },
      ],
    };
    return callSendAPI(senderPsid, response);
  }

  if (text.includes('tattoo')) return sendTattooFunnel(senderPsid);
  if (text.includes('piercing')) return sendPiercingFunnel(senderPsid);
  if (text.includes('jagua')) return sendJaguaFunnel(senderPsid);
  if (text.includes('face') || text.includes('paint')) return sendFacepaintFunnel(senderPsid);

  await callSendAPI(senderPsid, {
    text: "Not sure I understand — tap one of the options above to get started!",
  });
}

// Postback handler
async function handlePostback(senderPsid, receivedPostback) {
  const payload = receivedPostback.payload;

  if (payload === "SHOW_TATTOO_EXAMPLES") {
    await callSendAPI(senderPsid, {
      attachment: {
        type: "image",
        payload: {
          url: "https://yourwebsite.com/images/tattoo-example.jpg",
          is_reusable: true,
        },
      },
    });

    await callSendAPI(senderPsid, {
      text: "Like what you see? 💥 Tap below to book your custom tattoo session!",
      quick_replies: [
        { content_type: "text", title: "Book a Tattoo", payload: "BOOK_TATTOO" },
      ],
    });
  }

  if (payload === "BOOK_TATTOO") {
    await callSendAPI(senderPsid, {
      text: "Tap here to book your tattoo appointment: https://your-booking-link.com/tattoos"
    });
  }

  if (payload === "BOOK_PIERCING") {
    await callSendAPI(senderPsid, {
      text: "Book your body
