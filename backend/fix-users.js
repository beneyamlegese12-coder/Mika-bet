import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const client = new MongoClient('mongodb://localhost:27017');

async function fixUsers() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mikabet');
    const users = db.collection('users');
    
    const allUsers = await users.find().toArray();
    console.log('📋 Found', allUsers.length, 'users to fix');
    
    const hashedPassword = await bcrypt.hash('Test1234', 10);
    
    let count = 0;
    for (const user of allUsers) {
      const isAdmin = user.isAdmin === true ? true : false;
      
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            password: hashedPassword,
            isVerified: true,
            isActive: true,
            isAdmin: isAdmin,
            loginAttempts: 0,
            lockUntil: null
          } 
        }
      );
      count++;
      console.log('   ✅ Fixed:', user.email, '| isAdmin:', isAdmin);
    }
    
    console.log('\n✅', count, 'users fixed with password: Test1234');
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.close();
  }
}

fixUsers();