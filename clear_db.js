const { run } = require('./src/config/database');

async function clearData() {
  try {
    // Disable foreign keys temporarily if needed, or delete in correct order
    await run('DELETE FROM policies');
    console.log('Cleared policies table.');

    await run('DELETE FROM proposals');
    console.log('Cleared proposals table.');

    await run('DELETE FROM activities');
    console.log('Cleared activities table.');

    await run('DELETE FROM tasks');
    console.log('Cleared tasks table.');

    await run('DELETE FROM leads');
    console.log('Cleared leads table.');
    
    await run('DELETE FROM assessments');
    console.log('Cleared assessments table.');

    // Reset sqlite sequence to start IDs from 1 again
    await run('DELETE FROM sqlite_sequence WHERE name IN ("leads", "assessments", "policies", "proposals", "activities", "tasks")');
    console.log('Reset auto-increment IDs.');

    console.log('All test data cleared successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear data:', err);
    process.exit(1);
  }
}

clearData();
