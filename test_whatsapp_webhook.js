const fetch = require('node-fetch');

const sendWebhook = async (text, from = '2349000000000') => {
  const payload = {
    event: 'messages.upsert',
    data: {
      key: {
        fromMe: false,
        remoteJid: `${from}@s.whatsapp.net`,
        id: 'MOCK_' + Math.random().toString(36).substring(7)
      },
      message: {
        conversation: text
      },
      messageTimestamp: Math.floor(Date.now() / 1000)
    }
  };

  try {
    const res = await fetch('http://localhost:3016/api/webhook/evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`Sent: "${text}" | Response: ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
};

(async () => {
  console.log("--- Starting Simulated WhatsApp Flow ---");
  await sendWebhook('START ASSESSMENT');
  
  // Wait a moment, check DB
  setTimeout(async () => {
    await sendWebhook('John');
    
    setTimeout(async () => {
      await sendWebhook('john@coverscore.site');
    }, 2000);
  }, 2000);
})();
