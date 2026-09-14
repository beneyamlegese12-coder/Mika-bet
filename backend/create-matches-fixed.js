import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function createMatches() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mikabet');
    const matches = db.collection('matches');
    
    // Drop the matchId index if it exists
    try {
      await matches.dropIndex('matchId_1');
      console.log('🗑️ Dropped matchId index');
    } catch (e) {
      console.log('ℹ️ No matchId index to drop');
    }
    
    // Clear existing matches
    await matches.deleteMany({});
    console.log('🗑️ Cleared existing matches');
    
    // Create new matches with live status
    const newMatches = [
      {
        league: 'UEFA Champions League',
        homeTeam: 'Real Madrid',
        awayTeam: 'Bayern Munich',
        homeTeamLogo: '/logos/real-madrid.png',
        awayTeamLogo: '/logos/bayern.png',
        homeOdds: 2.15,
        drawOdds: 3.40,
        awayOdds: 3.20,
        kickoff: new Date(),
        status: 'LIVE',
        homeScore: 2,
        awayScore: 1,
        doubleChance: { '1X': 1.60, '12': 1.27, 'X2': 1.32 },
        bothScore: { yes: 1.61, no: 2.17 },
        overUnder: { over2_5: 1.85, under2_5: 1.95 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        league: 'USA-NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        homeTeamLogo: '/logos/lakers.png',
        awayTeamLogo: '/logos/celtics.png',
        homeOdds: 1.85,
        drawOdds: null,
        awayOdds: 2.10,
        kickoff: new Date(Date.now() + 15 * 60 * 1000),
        status: 'LIVE',
        homeScore: 68,
        awayScore: 72,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        league: 'Premier League',
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester City',
        homeTeamLogo: '/logos/liverpool.png',
        awayTeamLogo: '/logos/man-city.png',
        homeOdds: 2.80,
        drawOdds: 3.20,
        awayOdds: 2.40,
        kickoff: new Date(Date.now() + 30 * 60 * 1000),
        status: 'UPCOMING',
        doubleChance: { '1X': 1.50, '12': 1.30, 'X2': 1.40 },
        bothScore: { yes: 1.70, no: 2.05 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        league: 'La Liga',
        homeTeam: 'Barcelona',
        awayTeam: 'Atletico Madrid',
        homeTeamLogo: '/logos/barcelona.png',
        awayTeamLogo: '/logos/atletico.png',
        homeOdds: 1.95,
        drawOdds: 3.10,
        awayOdds: 3.80,
        kickoff: new Date(Date.now() + 60 * 60 * 1000),
        status: 'UPCOMING',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        league: 'Serie A',
        homeTeam: 'AC Milan',
        awayTeam: 'Inter Milan',
        homeTeamLogo: '/logos/milan.png',
        awayTeamLogo: '/logos/inter.png',
        homeOdds: 2.40,
        drawOdds: 3.00,
        awayOdds: 2.90,
        kickoff: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'UPCOMING',
        doubleChance: { '1X': 1.45, '12': 1.35, 'X2': 1.50 },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        league: 'Bundesliga',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        homeTeamLogo: '/logos/bayern.png',
        awayTeamLogo: '/logos/dortmund.png',
        homeOdds: 1.75,
        drawOdds: 3.50,
        awayOdds: 4.20,
        kickoff: new Date(Date.now() + 3 * 60 * 60 * 1000),
        status: 'UPCOMING',
        bothScore: { yes: 1.55, no: 2.30 },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert matches one by one to avoid duplicate errors
    let insertedCount = 0;
    for (const match of newMatches) {
      try {
        await matches.insertOne(match);
        insertedCount++;
        console.log(`   ✅ Created: ${match.league} - ${match.homeTeam} vs ${match.awayTeam} (${match.status})`);
      } catch (e) {
        console.log(`   ⚠️ Skipped: ${match.league} - ${e.message}`);
      }
    }
    
    // Verify
    const count = await matches.countDocuments();
    const liveCount = await matches.countDocuments({ status: 'LIVE' });
    console.log(`\n📋 Total: ${count} matches (${liveCount} live)`);
    
    // List all matches
    const allMatches = await matches.find().toArray();
    console.log('\n📋 Match List:');
    allMatches.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.league}: ${m.homeTeam} vs ${m.awayTeam} (${m.status})`);
    });
    
    await client.close();
    console.log('\n🎉 Matches created successfully!');
    
  } catch(e) {
    console.error('❌ Error:', e);
    await client.close();
  }
}

createMatches();