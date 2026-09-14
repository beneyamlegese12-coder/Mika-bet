import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function resetAll() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('');
    
    const db = client.db('mikabet');
    const users = db.collection('users');
    
    const allUsers = await users.find().toArray();
    console.log('📋 Found ' + allUsers.length + ' user(s)');
    console.log('');
    
    if (allUsers.length === 0) {
      console.log('❌ No users found!');
      return;
    }
    
    const newPassword = 'Test1234';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    let updatedCount = 0;
    for (const user of allUsers) {
      const result = await users.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, isVerified: true, isActive: true } }
      );
      if (result.modifiedCount > 0 || result.matchedCount > 0) {
        updatedCount++;
        console.log('   ✅ Updated: ' + user.email);
      }
    }
    
    console.log('');
    console.log('✅ ' + updatedCount + ' user(s) password reset successfully!');
    console.log('');
    console.log('📋 All users can now login with:');
    console.log('   Password: ' + newPassword);
    console.log('');
    console.log('👤 Users:');
    allUsers.forEach((user) => {
      console.log('   - ' + user.email + ' (Username: ' + user.username + ')');
    });
    
    await client.close();
    console.log('');
    console.log('🎉 Done! All passwords have been reset to: ' + newPassword);
    
  } catch(e) {
    console.error('❌ Error:', e.message);
    await client.close();
  }
}

resetAll();
