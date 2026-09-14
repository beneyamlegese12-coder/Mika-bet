import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const client = new MongoClient('mongodb://localhost:27017');

async function createAllUsers() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mikabet');
    const users = db.collection('users');

    // Hash passwords
    const adminPass = await bcrypt.hash('Admin1234', 10);
    const playerPass = await bcrypt.hash('Test1234', 10);
    const agentPass = await bcrypt.hash('Agent1234', 10);
    const superPass = await bcrypt.hash('Super1234', 10);

    // Create all users with unique data
    const allUsers = [
      {
        username: 'admin',
        email: 'admin@mikabet.com',
        phone: '+251911111111',
        password: adminPass,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isVerified: true,
        isActive: true,
        isBlocked: false,
        balance: 100000,
        currency: 'ETB',
        loginAttempts: 0,
        lockUntil: null,
        referralCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'player1',
        email: 'player1@mikabet.com',
        phone: '+251912222222',
        password: playerPass,
        firstName: 'Player',
        lastName: 'One',
        role: 'player',
        isVerified: true,
        isActive: true,
        isBlocked: false,
        balance: 1000,
        currency: 'ETB',
        loginAttempts: 0,
        lockUntil: null,
        referralCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'agent1',
        email: 'agent1@mikabet.com',
        phone: '+251913333333',
        password: agentPass,
        firstName: 'Agent',
        lastName: 'One',
        role: 'agent',
        isVerified: true,
        isActive: true,
        isBlocked: false,
        balance: 5000,
        currency: 'ETB',
        loginAttempts: 0,
        lockUntil: null,
        referralCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'superagent1',
        email: 'superagent1@mikabet.com',
        phone: '+251914444444',
        password: superPass,
        firstName: 'Super',
        lastName: 'Agent',
        role: 'superagent',
        isVerified: true,
        isActive: true,
        isBlocked: false,
        balance: 20000,
        currency: 'ETB',
        loginAttempts: 0,
        lockUntil: null,
        referralCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = await users.insertMany(allUsers);
    console.log(`✅ ${result.insertedCount} users created successfully!`);
    console.log('\n📋 Login Credentials:');
    console.log('   🛡️ Admin:      admin@mikabet.com / Admin1234');
    console.log('   🎮 Player:     player1@mikabet.com / Test1234');
    console.log('   👔 Agent:      agent1@mikabet.com / Agent1234');
    console.log('   ⭐ SuperAgent: superagent1@mikabet.com / Super1234');

    await client.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await client.close();
  }
}

createAllUsers();