import { testConnection, closePool } from './database.js';

async function main() {
  console.log('Testing database connection...');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('🎉 Database setup is working correctly!');
  } else {
    console.log('💥 Database connection failed. Check your .env file.');
  }
  
  await closePool();
  process.exit(0);
}

main();
