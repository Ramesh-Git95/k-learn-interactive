const express = require('express');
const router = express.Router();
const SRSDeck = require('../models/SRSDeck');
const { authenticateToken } = require('../middleware/auth');

// Get all user's SRS decks
router.get('/decks', authenticateToken, async (req, res) => {
  try {
    console.log('📚 Fetching SRS decks for user:', req.user._id);
    
    const decks = await SRSDeck.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${decks.length} SRS decks`);
    res.json({ decks });
  } catch (error) {
    console.error('❌ Error fetching SRS decks:', error);
    res.status(500).json({ error: 'Failed to fetch SRS decks' });
  }
});

// Sync SRS data from localStorage to database
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Syncing SRS data for user:', req.user._id);
    console.log('📦 Request body keys:', Object.keys(req.body));
    console.log('📊 Decks data:', req.body.decks ? `Array with ${req.body.decks.length} items` : 'undefined');
    
    const { decks } = req.body;
    
    if (!Array.isArray(decks)) {
      console.log('❌ Invalid decks data format:', typeof decks);
      return res.status(400).json({ error: 'Invalid decks data format' });
    }
    
    console.log('🗑️ Removing existing SRS decks for user:', req.user._id);
    // Remove all existing decks for this user
    await SRSDeck.deleteMany({ userId: req.user._id });
    console.log('✅ Cleared existing SRS decks');
    
    // Add user ID to each deck and save
    const decksWithUserId = decks.map(deck => ({
      ...deck,
      userId: req.user._id,
      modifiedAt: new Date()
    }));
    
    console.log('💾 Saving decks to database:', decksWithUserId.length);
    
    if (decksWithUserId.length > 0) {
      const savedDecks = await SRSDeck.insertMany(decksWithUserId);
      console.log(`✅ Synced ${savedDecks.length} SRS decks to database`);
    }
    
    res.json({ 
      message: 'SRS data synced successfully', 
      syncedDecks: decksWithUserId.length 
    });
  } catch (error) {
    console.error('❌ Error syncing SRS data:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    res.status(500).json({ 
      error: 'Failed to sync SRS data',
      details: error.message 
    });
  }
});

// Create a new deck
router.post('/decks', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Creating new SRS deck for user:', req.user._id);
    const { id, name, description, settings } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ error: 'Deck ID and name are required' });
    }
    
    const newDeck = new SRSDeck({
      id,
      name,
      description: description || '',
      cards: [],
      settings: settings || {
        newCardsPerDay: 10,
        maxReviewsPerDay: 50,
        graduationInterval: 4,
        easyInterval: 7,
        hardInterval: 0.85,
        lapseInterval: 1,
      },
      stats: {
        totalCards: 0,
        newCards: 0,
        learningCards: 0,
        reviewCards: 0,
        matureCards: 0,
        dailyReviews: 0,
        accuracy: 0,
      },
      userId: req.user._id
    });
    
    const savedDeck = await newDeck.save();
    console.log('✅ Created new SRS deck:', savedDeck.id);
    
    res.status(201).json({ deck: savedDeck });
  } catch (error) {
    console.error('❌ Error creating SRS deck:', error);
    res.status(500).json({ error: 'Failed to create SRS deck' });
  }
});

// Update a deck
router.put('/decks/:deckId', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Updating SRS deck:', req.params.deckId, 'for user:', req.user._id);
    
    const updatedDeck = await SRSDeck.findOneAndUpdate(
      { id: req.params.deckId, userId: req.user._id },
      { ...req.body, modifiedAt: new Date() },
      { new: true }
    );
    
    if (!updatedDeck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    console.log('✅ Updated SRS deck:', updatedDeck.id);
    res.json({ deck: updatedDeck });
  } catch (error) {
    console.error('❌ Error updating SRS deck:', error);
    res.status(500).json({ error: 'Failed to update SRS deck' });
  }
});

// Delete a deck
router.delete('/decks/:deckId', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ Deleting SRS deck:', req.params.deckId, 'for user:', req.user._id);
    
    const deletedDeck = await SRSDeck.findOneAndDelete({
      id: req.params.deckId,
      userId: req.user._id
    });
    
    if (!deletedDeck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    console.log('✅ Deleted SRS deck:', deletedDeck.id);
    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting SRS deck:', error);
    res.status(500).json({ error: 'Failed to delete SRS deck' });
  }
});

// Add card to deck
router.post('/decks/:deckId/cards', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Adding card to SRS deck:', req.params.deckId, 'for user:', req.user._id);
    
    const { card } = req.body;
    if (!card) {
      return res.status(400).json({ error: 'Card data is required' });
    }
    
    const deck = await SRSDeck.findOne({
      id: req.params.deckId,
      userId: req.user._id
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    // Add the card
    deck.cards.push(card);
    deck.stats.totalCards = deck.cards.length;
    deck.stats.newCards = deck.cards.filter(c => c.srs.repetitions === 0).length;
    deck.modifiedAt = new Date();
    
    await deck.save();
    
    console.log('✅ Added card to SRS deck:', deck.id);
    res.status(201).json({ deck, cardId: card.id });
  } catch (error) {
    console.error('❌ Error adding card to SRS deck:', error);
    res.status(500).json({ error: 'Failed to add card to deck' });
  }
});

// Update card in deck
router.put('/decks/:deckId/cards/:cardId', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Updating card in SRS deck:', req.params.deckId, 'card:', req.params.cardId);
    
    const deck = await SRSDeck.findOne({
      id: req.params.deckId,
      userId: req.user._id
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    const cardIndex = deck.cards.findIndex(c => c.id === req.params.cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    // Update the card
    deck.cards[cardIndex] = { ...deck.cards[cardIndex], ...req.body, modifiedAt: new Date() };
    deck.modifiedAt = new Date();
    
    await deck.save();
    
    console.log('✅ Updated card in SRS deck:', deck.id);
    res.json({ deck, card: deck.cards[cardIndex] });
  } catch (error) {
    console.error('❌ Error updating card in SRS deck:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// Delete card from deck
router.delete('/decks/:deckId/cards/:cardId', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ Deleting card from SRS deck:', req.params.deckId, 'card:', req.params.cardId);
    
    const deck = await SRSDeck.findOne({
      id: req.params.deckId,
      userId: req.user._id
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    const originalLength = deck.cards.length;
    deck.cards = deck.cards.filter(c => c.id !== req.params.cardId);
    
    if (deck.cards.length === originalLength) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    // Update stats
    deck.stats.totalCards = deck.cards.length;
    deck.stats.newCards = deck.cards.filter(c => c.srs.repetitions === 0).length;
    deck.modifiedAt = new Date();
    
    await deck.save();
    
    console.log('✅ Deleted card from SRS deck:', deck.id);
    res.json({ deck, message: 'Card deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting card from SRS deck:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

module.exports = router;
