const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('All collections:');
    collections.forEach(col => console.log('- ' + col.name));
    
    // Check if srsdecks collection exists and has data
    const srsCollection = db.collection('srsdecks');
    const srsCount = await srsCollection.countDocuments();
    console.log('\nSRS Decks collection count:', srsCount);
    
    if (srsCount > 0) {
      const srsDecks = await srsCollection.find({}).toArray();
      console.log('\nSRS Decks data:');
      srsDecks.forEach((deck, i) => {
        console.log(`Deck ${i + 1}:`, {
          id: deck.id,
          name: deck.name,
          userId: deck.userId,
          cardsCount: deck.cards?.length || 0,
          cards: deck.cards?.map(card => ({ 
            id: card.id, 
            korean: card.content?.korean, 
            english: card.content?.english 
          }))
        });
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCollections();
