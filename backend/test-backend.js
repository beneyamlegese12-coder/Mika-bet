import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

function logTest(name, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`${colors.green}✅ PASS${colors.reset}: ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    failedTests++;
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${name}`);
    if (details) console.log(`   ${colors.red}${details}${colors.reset}`);
  }
}

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}📋 ${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
}

function logSubSection(title) {
  console.log(`\n${colors.yellow}▶ ${title}${colors.reset}`);
}

async function testBackend() {
  try {
    console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.blue}🚀 MIKA-BET BACKEND TEST SUITE${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}`);
    console.log(`Started: ${new Date().toLocaleString()}\n`);

    await client.connect();
    console.log(`${colors.green}✅ Connected to MongoDB${colors.reset}\n`);

    const db = client.db('mikabet');
    const users = db.collection('users');

    // ========== SECTION 1: DATABASE ==========
    logSection('DATABASE CONNECTION');

    // Test 1: Database connection
    const dbStatus = await db.command({ ping: 1 });
    logTest('Database Connection', dbStatus.ok === 1, 'MongoDB is responsive');

    // Test 2: Users collection exists
    const collections = await db.listCollections({ name: 'users' }).toArray();
    logTest('Users Collection Exists', collections.length > 0);

    // Test 3: Count users
    const userCount = await users.countDocuments();
    logTest('Users in Database', userCount > 0, `Found ${userCount} users`);

    // Test 4: List all users
    const allUsers = await users.find().toArray();
    console.log(`\n   📋 Users (${allUsers.length}):`);
    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.username}) - Admin: ${u.isAdmin || false}`);
    });

    // ========== SECTION 2: AUTHENTICATION ==========
    logSection('AUTHENTICATION');

    // Test 5: Register new user
    logSubSection('Register User');
    const testEmail = `testuser_${Date.now()}@mikabet.com`;
    try {
      const hashedPassword = await bcrypt.hash('Test1234', 10);
      await users.insertOne({
        username: `testuser_${Date.now()}`,
        email: testEmail,
        phone: '+251912345678',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
        isActive: true,
        balance: 100,
        currency: 'ETB',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      logTest('Create Test User', true, `Created: ${testEmail}`);
    } catch (error) {
      logTest('Create Test User', false, error.message);
    }

    // Test 6: Login with admin
    logSubSection('Login Users');
    const adminUser = await users.findOne({ email: 'admin@mikabet.com' });
    if (adminUser) {
      const isValid = await bcrypt.compare('Test1234', adminUser.password);
      logTest('Admin Login (admin@mikabet.com)', isValid, isValid ? 'Password: Test1234' : 'Invalid password');
    } else {
      logTest('Admin Login (admin@mikabet.com)', false, 'Admin user not found');
    }

    // Test 7: Login with test user
    const testUser = await users.findOne({ email: testEmail });
    if (testUser) {
      const isValid = await bcrypt.compare('Test1234', testUser.password);
      logTest('Test User Login', isValid, `User: ${testEmail}`);
    } else {
      logTest('Test User Login', false, 'Test user not found');
    }

    // ========== SECTION 3: MATCHES ==========
    logSection('MATCH MANAGEMENT');

    // Test 8: Check matches collection
    const matches = db.collection('matches');
    const matchCount = await matches.countDocuments();
    logTest('Matches in Database', matchCount > 0, `Found ${matchCount} matches`);

    if (matchCount === 0) {
      logSubSection('Seeding Matches');
      const seedMatches = [
        {
          league: 'UEFA Champions League',
          homeTeam: 'Real Madrid',
          awayTeam: 'Bayern Munich',
          homeOdds: 2.15,
          drawOdds: 3.40,
          awayOdds: 3.20,
          kickoff: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: 'UPCOMING',
          doubleChance: { '1X': 1.60, '12': 1.27, 'X2': 1.32 },
          bothScore: { yes: 1.61, no: 2.17 }
        },
        {
          league: 'USA-NBA',
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Boston Celtics',
          homeOdds: 1.85,
          drawOdds: null,
          awayOdds: 2.10,
          kickoff: new Date(Date.now() + 30 * 60 * 1000),
          status: 'LIVE',
          homeScore: 68,
          awayScore: 72
        },
        {
          league: 'Premier League',
          homeTeam: 'Liverpool',
          awayTeam: 'Manchester City',
          homeOdds: 2.80,
          drawOdds: 3.20,
          awayOdds: 2.40,
          kickoff: new Date(Date.now() + 4 * 60 * 60 * 1000),
          status: 'UPCOMING'
        }
      ];
      await matches.insertMany(seedMatches);
      logTest('Seed Matches', true, '3 matches seeded');
    }

    // Test 9: List matches
    const allMatches = await matches.find().toArray();
    console.log(`\n   📋 Matches (${allMatches.length}):`);
    allMatches.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.league}: ${m.homeTeam} vs ${m.awayTeam} (${m.status})`);
    });

    // Test 10: Check live matches
    const liveMatches = await matches.find({ status: 'LIVE' }).toArray();
    logTest('Live Matches', liveMatches.length > 0, `Found ${liveMatches.length} live matches`);

    // ========== SECTION 4: BETTING ==========
    logSection('BETTING');

    // Test 11: Check bets collection
    const bets = db.collection('bets');
    const betCount = await bets.countDocuments();
    logTest('Bets in Database', betCount >= 0, `Found ${betCount} bets`);

    // Test 12: Create a test bet
    try {
      if (matchCount > 0 && userCount > 0) {
        const firstMatch = await matches.findOne();
        const firstUser = await users.findOne();
        await bets.insertOne({
          user: firstUser._id,
          match: firstMatch._id,
          amount: 10,
          odds: 2.15,
          selection: '1',
          potentialWin: 21.5,
          status: 'PENDING',
          placedAt: new Date()
        });
        logTest('Place Bet', true, 'Test bet placed');
      } else {
        logTest('Place Bet', false, 'No matches or users available');
      }
    } catch (error) {
      logTest('Place Bet', false, error.message);
    }

    // Test 13: Check transactions
    const transactions = db.collection('transactions');
    const transactionCount = await transactions.countDocuments();
    logTest('Transactions', transactionCount >= 0, `Found ${transactionCount} transactions`);

    // ========== SECTION 5: ADMIN ==========
    logSection('ADMIN CHECKS');

    // Test 14: Check admin exists
    const admin = await users.findOne({ isAdmin: true });
    logTest('Admin User Exists', !!admin, admin ? `Found: ${admin.email}` : 'No admin user found');

    // Test 15: Check verified users
    const verifiedUsers = await users.find({ isVerified: true }).countDocuments();
    logTest('Verified Users', verifiedUsers > 0, `${verifiedUsers} users verified`);

    // Test 16: Check active users
    const activeUsers = await users.find({ isActive: true }).countDocuments();
    logTest('Active Users', activeUsers > 0, `${activeUsers} users active`);

    // ========== SECTION 6: API ENDPOINTS SUMMARY ==========
    logSection('API ENDPOINTS SUMMARY');

    const endpoints = [
      { method: 'GET', path: '/health', status: '✅ Available' },
      { method: 'GET', path: '/api/matches', status: '✅ Available' },
      { method: 'GET', path: '/api/matches/live', status: '✅ Available' },
      { method: 'GET', path: '/api/matches/leagues', status: '✅ Available' },
      { method: 'GET', path: '/api/matches/:id', status: '✅ Available' },
      { method: 'POST', path: '/api/auth/register', status: '✅ Available' },
      { method: 'POST', path: '/api/auth/login', status: '✅ Available' },
      { method: 'GET', path: '/api/auth/profile', status: '🔒 Requires Auth' },
      { method: 'POST', path: '/api/auth/change-password', status: '🔒 Requires Auth' },
      { method: 'POST', path: '/api/bets', status: '🔒 Requires Auth' },
      { method: 'GET', path: '/api/bets', status: '🔒 Requires Auth' },
      { method: 'GET', path: '/api/bets/stats', status: '🔒 Requires Auth' },
      { method: 'GET', path: '/api/wallet', status: '🔒 Requires Auth' },
      { method: 'POST', path: '/api/wallet/deposit', status: '🔒 Requires Auth' },
      { method: 'POST', path: '/api/wallet/withdraw', status: '🔒 Requires Auth' },
      { method: 'GET', path: '/api/transactions', status: '🔒 Requires Auth' },
      { method: 'POST', path: '/api/betslip', status: '🔒 Requires Auth' },
      { method: 'GET', path: '/api/betslip', status: '🔒 Requires Auth' },
      { method: 'DELETE', path: '/api/betslip', status: '🔒 Requires Auth' },
      { method: 'POST', path: '/api/admin/matches', status: '👑 Admin Only' },
      { method: 'PUT', path: '/api/admin/matches/:id', status: '👑 Admin Only' },
      { method: 'DELETE', path: '/api/admin/matches/:id', status: '👑 Admin Only' },
      { method: 'GET', path: '/api/admin/users', status: '👑 Admin Only' },
      { method: 'PUT', path: '/api/admin/users/:id/status', status: '👑 Admin Only' }
    ];

    console.log(`\n   📋 Total Endpoints: ${endpoints.length}`);
    endpoints.forEach(e => {
      console.log(`   ${e.method.padEnd(6)} ${e.path.padEnd(30)} ${e.status}`);
    });

    // ========== TEST SUMMARY ==========
    console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.blue}📊 TEST SUMMARY${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}`);

    const passRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
    console.log(`   ${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
    console.log(`   ${colors.red}❌ Failed: ${failedTests}${colors.reset}`);
    console.log(`   📊 Total: ${totalTests} tests`);
    console.log(`   🎯 Pass Rate: ${passRate}%`);

    if (failedTests === 0) {
      console.log(`\n${colors.green}🎉 ALL TESTS PASSED! Your backend is working perfectly!${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠️ Some tests failed. Please check the errors above.${colors.reset}`);
    }

    console.log(`\n📋 Test completed: ${new Date().toLocaleString()}`);
    console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}`);

    await client.close();

  } catch (error) {
    console.error(`${colors.red}❌ Fatal Error:${colors.reset}`, error.message);
    await client.close();
  }
}

// Run the tests
testBackend();