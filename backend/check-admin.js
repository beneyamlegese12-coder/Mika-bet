import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkAdmin() {
  try {
    await client.connect();
    const db = client.db('mikabet');
    const users = db.collection('users');
    
    // Check if admin exists
    const admin = await users.findOne({ email: 'admin@mikabet.com' });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('   Email:', admin.email);
      console.log('   Username:', admin.username);
      console.log('   Verified:', admin.isVerified);
      console.log('   Active:', admin.isActive);
      console.log('   Has Password:', !!admin.password);
    } else {
      console.log('❌ Admin user NOT found!');
    }
    
    // Show all users
    const allUsers = await users.find().toArray();
    console.log('\n📋 All users:');
    allUsers.forEach(u => {
      console.log('   -', u.email, '(Verified:', u.isVerified, ')');
    });
    
    await client.close();
  } catch(e) {
    console.error('Error:', e);
  }
}

checkAdmin();
