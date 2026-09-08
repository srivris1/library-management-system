/**
 * This script forces mongodb-memory-server to download
 * the MongoDB binary during the build step (not at runtime).
 * This prevents the server from timing out on Render's free tier.
 */

async function downloadBinary() {
  console.log('⬇️  Pre-downloading MongoDB binary for in-memory server...');
  console.log(`   Platform: ${process.platform}, Arch: ${process.arch}`);
  
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`✅ MongoDB binary downloaded and verified. Test URI: ${uri}`);
    await mongod.stop();
    console.log('✅ Binary is cached and ready for runtime.');
    process.exit(0);
  } catch (err) {
    console.error('⚠️  Failed to pre-download MongoDB binary:', err.message);
    console.error('   Stack:', err.stack);
    // Don't exit with error code — let the build continue
    // The server will attempt to download at runtime
    process.exit(0);
  }
}

downloadBinary();
