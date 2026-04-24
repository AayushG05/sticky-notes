const mongoose = require('mongoose');

async function runDbFixes() {
  try {
    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();
    
    const hasUsernameIndex = indexes.some(idx => idx.name === 'username_1');
    
    if (hasUsernameIndex) {
      console.log('Maintenance: Dropping redundant unique username index...');
      await collection.dropIndex('username_1');
      console.log('Maintenance: Index dropped successfully.');
    }
  } catch (error) {
    console.error('Maintenance Error:', error.message);
    // We don't want to crash the server if maintenance fails
  }
}

module.exports = runDbFixes;
