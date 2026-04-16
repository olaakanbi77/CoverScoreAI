require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ userId: 1, role: 'admin' }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '15m' });
console.log('Token created, testing API...');

// Test /api/leads first
const listOptions = {
  hostname: 'localhost',
  port: 3016,
  path: '/api/leads?page=1&limit=15',
  headers: { Authorization: `Bearer ${token}` }
};

http.get(listOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n=== GET /api/leads ===');
    console.log('Status:', res.statusCode);
    try {
      if (data) {
        const parsed = JSON.parse(data);
        console.log('Leads count:', parsed.leads?.length);
        if (parsed.leads?.length > 0) {
          const leadId = parsed.leads[0].id;
          console.log('First lead ID:', leadId);
        }
      } else {
        console.log('No data returned');
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
}).on('error', e => {
  console.log('Request error (is the server running?):', e.message);
});
