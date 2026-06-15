const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Mock req body
const body = {
  data: {
    key: { remoteJid: "2349165304629@s.whatsapp.net", fromMe: false },
    message: { conversation: "START ASSESSMENT" }
  }
};

const messageData = body.data;
const phoneNumber = messageData.key.remoteJid.split('@')[0];
const incomingTextRaw = messageData.message.conversation || messageData.message.text || '';
const incomingText = incomingTextRaw.trim().toUpperCase();

console.log("phoneNumber:", phoneNumber);
console.log("incomingText:", incomingText);

const isStartTrigger = incomingText.includes('START ') && incomingText.includes(' ASSESSMENT');
const isRestartTrigger = isStartTrigger || incomingText.includes('RESTART') || incomingText.includes('START OVER');
console.log("isStartTrigger:", isStartTrigger, "isRestartTrigger:", isRestartTrigger);

const db = new sqlite3.Database('./data/coverscore.db');

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function testWebhook() {
  try {
    const searchPhone = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;
    let lead = { id: 1, wa_state: 'welcome_email', chat_history: '[]', assessment_data: '{}' };

    
    let currentState, chatHistory, assessmentData;

    console.log("LEAD:", lead);

    if (lead) {
      if (isRestartTrigger) {
        console.log(`Lead ${lead.id} requesting restart mid-flow`);
        currentState = 'welcome_name';
        chatHistory = [];
        assessmentData = {};
      } else {
        currentState = lead.wa_state || 'initial';
        chatHistory = JSON.parse(lead.chat_history || '[]');
        assessmentData = JSON.parse(lead.assessment_data || '{}');
      }
    } else if (isStartTrigger || isRestartTrigger) {
      console.log(`Creating NEW lead for phone ${phoneNumber}`);
      currentState = 'welcome_name';
      chatHistory = [];
      assessmentData = {};
    }

    console.log("currentState:", currentState);
    console.log("chatHistory:", chatHistory);

    if (currentState === 'welcome_name' && (isStartTrigger || isRestartTrigger)) {
      console.log("SENDING WELCOME MESSAGE");
      chatHistory.push({
        role: 'user',
        content: incomingTextRaw,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      });
      console.log("chatHistory pushed successfully");
      return;
    }
    
    console.log("Passed welcome message block.");

  } catch (e) {
    console.error("CRASHED:", e);
  }
}

testWebhook();
