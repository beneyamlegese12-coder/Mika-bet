import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function createAdmin() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mikabet');
    const users = db.collection('users');
    
    // Check if admin exists
    const existingAdmin = await users.findOne({ email: 'admin@mikabet.com' });
    
    if (existingAdmin) {
      console.log('📋 Admin user already exists, updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash('Admin1234', 10);
      await users.updateOne(
        { email: 'admin@mikabet.com' },
        { 
          $set: { 
            password: hashedPassword,
            isVerified: true,
            isActive: true,
            isAdmin: true,
            loginAttempts: 0,
            lockUntil: null
          } 
        }
      );
      console.log('✅ Admin password updated!');
    } else {
      console.log('📋 Creating new admin user...');
      
      // Create admin
      const hashedPassword = await bcrypt.hash('Admin1234', 10);
      await users.insertOne({
        username: 'admin',
        email: 'admin@mikabet.com',
        phone: '+251987654321',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isVerified: true,
        isActive: true,
        isAdmin: true,
        balance: 5000,
        currency: 'ETB',
        loginAttempts: 0,
        lockUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Admin user created!');
    }
    
    // Verify admin
    const admin = await users.findOne({ email: 'admin@mikabet.com' });
    console.log('\n📋 Admin user details:');
    console.log('   Email:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   isAdmin:', admin.isAdmin);
    console.log('   Verified:', admin.isVerified);
    console.log('   Balance:', admin.balance);
    
    await client.close();
    console.log('\n🎉 Done! Login with:');
    console.log('   Email: admin@mikabet.com');
    console.log('   Password: Admin1234');
    
  } catch(e) {
    console.error('❌ Error:', e);
    await client.close();
  }
}

createAdmin();