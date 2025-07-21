import { testConnection, closePool } from './database-no-ssl.js';

async function main() {
  console.log('Testing database connection without SSL...');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('🎉 Database setup is working correctly!');
  } else {
    console.log('💥 Database connection failed.');
  }
  
  await closePool();
  process.exit(0);
}

main();
