import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');

async function verifyUsers() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('mikabet');
    const users = db.collection('users');
    
    const allUsers = await users.find().toArray();
    console.log('📋 Users in database:\n');
    
    allUsers.forEach((u, i) => {
      console.log((i+1) + '.', u.email, '| Username:', u.username, '| isAdmin:', u.isAdmin);
    });
    
    console.log('\nTotal:', allUsers.length, 'users');
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.close();
  }
}

verifyUsers();