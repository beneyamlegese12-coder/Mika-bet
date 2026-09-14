import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkUsers() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('');
    
    const db = client.db('mikabet');
    const users = db.collection('users');
    
    const allUsers = await users.find().toArray();
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!');
      console.log('Please register first at: http://localhost:3000/register');
    } else {
      console.log('📋 Found ' + allUsers.length + ' user(s):');
      console.log('');
      allUsers.forEach((user, index) => {
        console.log('👤 User ' + (index + 1) + ':');
        console.log('   Email: ' + user.email);
        console.log('   Username: ' + user.username);
        console.log('   Verified: ' + user.isVerified);
        console.log('   Active: ' + user.isActive);
        console.log('   Has Password: ' + !!user.password);
        console.log('   Password Length: ' + (user.password?.length || 0));
        console.log('---');
      });
    }
    
    await client.close();
  } catch(e) {
    console.error('❌ Error:', e.message);
  }
}

checkUsers();
