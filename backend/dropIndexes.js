require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndexes() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const drops = [
    ['members', 'memberId_1'],
    ['payments', 'invoiceNo_1'],
    ['attendance', 'member_1_date_1'],
    ['attendance', 'memberId_1_date_1']
  ];

  for (const [collection, index] of drops) {
    try {
      await db.collection(collection).dropIndex(index);
      console.log(`Dropped ${collection}.${index}`);
    } catch (err) {
      console.log(`${collection}.${index} not found (ok)`);
    }
  }

  await mongoose.disconnect();
  console.log('Done. Now run: npm run seed');
}

dropIndexes().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
});
