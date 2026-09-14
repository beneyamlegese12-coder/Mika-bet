import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const client = new MongoClient('mongodb://localhost:27017');

async function updateRoles() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mikabet');
    const users = db.collection('users');
    
    // Get all users first
    const allUsers = await users.find().toArray();
    console.log('📋 Found', allUsers.length, 'users');
    
    // Define role mappings
    const roleMappings = {
      'admin@mikabet.com': 'admin',
      'superagent1@mikabet.com': 'agent',
      'superagent2@mikabet.com': 'agent',
      'agent1@mikabet.com': 'agent',
      'agent2@mikabet.com': 'agent',
      'agent3@mikabet.com': 'agent',
      'customer1@mikabet.com': 'player',
      'customer2@mikabet.com': 'player',
      'customer3@mikabet.com': 'player',
      'customer4@mikabet.com': 'player',
      'beneyamlegese12@gmail.com': 'player',
      'sisayabera@gmail.com': 'player'
    };
    
    // Hash password once
    const hashedPassword = await bcrypt.hash('Test1234', 10);
    
    let updatedCount = 0;
    for (const user of allUsers) {
      const newRole = roleMappings[user.email] || 'player';
      
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            role: newRole,
            password: hashedPassword,
            isVerified: true,
            isActive: true,
            loginAttempts: 0,
            lockUntil: null
          } 
        }
      );
      
      console.log(`   ✅ ${user.email} → ${newRole}`);
      updatedCount++;
    }
    
    console.log('\n✅ Updated', updatedCount, 'users');
    console.log('🔑 All passwords set to: Test1234');
    
    // Verify final roles
    const verified = await users.find().toArray();
    console.log('\n📋 Final roles:');
    verified.forEach(u => {
      console.log(`   ${u.email} → ${u.role || 'player'}`);
    });
    
    await client.close();
    console.log('\n🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.close();
  }
}

updateRoles();