const { run, get, initDatabase } = require('./src/config/database');

async function test() {
  console.log('Testing dual database wrapper...');
  
  try {
    // Ensure DB is initialized
    initDatabase();
    
    // Wait a second for sqlite to init tables
    await new Promise(r => setTimeout(r, 1000));

    console.log('Inserting mock lead...');
    const insertResult = await run(
      'INSERT INTO leads (name, email, phone) VALUES (?, ?, ?)', 
      ['Test User', 'test@coverscore.ng', '2348000000000']
    );
    console.log('Insert result:', insertResult);

    console.log('Fetching mock lead...');
    const fetchResult = await get('SELECT * FROM leads WHERE phone = ?', ['2348000000000']);
    console.log('Fetch result:', fetchResult);
    
    console.log('Test successful! SQLite fallback is fully functional.');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();
