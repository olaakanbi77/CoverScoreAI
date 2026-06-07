const fetch = require('node-fetch');

async function updateWebhook() {
  const url = "http://163.245.210.111:8081/webhook/set/Coverscore";
  const apiKey = "CoverScoreEvolution2024SecureKey";
  
  const payload = {
    webhook: {
      url: "https://coverscore.site/api/webhook/evolution",
      enabled: true,
      webhookByEvents: false,
      webhookBase64: false,
      events: ["MESSAGES_UPSERT"]
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("Response:", JSON.stringify(data));
  } catch (err) {
    console.error("Error:", err);
  }
}

updateWebhook();
