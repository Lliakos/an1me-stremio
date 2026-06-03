// test-provider.js
const { getStreams } = require('./providers/an1me.js');

async function testRunner() {
    console.log('🧪 Simulating App Call to Provider Engine...\n');
    
    // Testing One Piece (TMDB ID: 37854) Season 1, Episode 1164
    const streams = await getStreams('37854', 'tv', 1, 1164);
    
    console.log(`\n🏁 Total Streams Returned to Nuvio Client: ${streams.length}`);
    streams.forEach((stream, idx) => {
        console.log(`   [${idx + 1}] Title: ${stream.title} | Quality: ${stream.quality}`);
        console.log(`       URL: ${stream.url}`);
    });
}

testRunner();