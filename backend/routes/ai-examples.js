const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Mock database - replace with your actual database connection
let aiExamplesStore = new Map();

/**
 * Store an AI example for a user
 * POST /api/ai-examples
 */
router.post('/', 
  authenticateToken,
  [
    body('word').notEmpty().withMessage('Word is required'),
    body('type').isIn(['vocabulary', 'grammar']).withMessage('Type must be vocabulary or grammar'),
    body('example').isObject().withMessage('Example must be an object'),
    body('example.korean').notEmpty().withMessage('Korean text is required'),
    body('example.english').notEmpty().withMessage('English translation is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { word, type, example } = req.body;
      const userId = req.user.id;

      // Create a unique key for this user's example
      const key = `${userId}_${word}_${type}`;
      
      const storedExample = {
        word,
        type,
        example: {
          korean: example.korean,
          english: example.english,
          romanization: example.romanization || null
        },
        createdAt: new Date(),
        userId
      };

      // In a real app, save to MongoDB/PostgreSQL
      aiExamplesStore.set(key, storedExample);

      res.json({
        success: true,
        message: 'AI example stored successfully',
        data: storedExample
      });

    } catch (error) {
      console.error('Error storing AI example:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to store AI example'
      });
    }
  }
);

/**
 * Get stored AI example for a user
 * GET /api/ai-examples?word=hello&type=vocabulary
 */
router.get('/',
  authenticateToken,
  [
    query('word').notEmpty().withMessage('Word parameter is required'),
    query('type').isIn(['vocabulary', 'grammar']).withMessage('Type must be vocabulary or grammar'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { word, type } = req.query;
      const userId = req.user.id;

      // Create the key to look up
      const key = `${userId}_${word}_${type}`;
      
      // In a real app, query from MongoDB/PostgreSQL
      const storedExample = aiExamplesStore.get(key);

      if (!storedExample) {
        return res.status(404).json({
          success: false,
          message: 'No stored example found'
        });
      }

      res.json({
        success: true,
        data: storedExample
      });

    } catch (error) {
      console.error('Error retrieving AI example:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI example'
      });
    }
  }
);

/**
 * Delete stored AI example for a user
 * DELETE /api/ai-examples?word=hello&type=vocabulary
 */
router.delete('/',
  authenticateToken,
  [
    query('word').notEmpty().withMessage('Word parameter is required'),
    query('type').isIn(['vocabulary', 'grammar']).withMessage('Type must be vocabulary or grammar'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { word, type } = req.query;
      const userId = req.user.id;

      // Create the key to delete
      const key = `${userId}_${word}_${type}`;
      
      // In a real app, delete from MongoDB/PostgreSQL
      const deleted = aiExamplesStore.delete(key);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'No stored example found to delete'
        });
      }

      res.json({
        success: true,
        message: 'AI example deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting AI example:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete AI example'
      });
    }
  }
);

/**
 * Get all stored AI examples for a user (for debugging/admin)
 * GET /api/ai-examples/all
 */
router.get('/all',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Filter examples for this user
      const userExamples = [];
      for (const [key, example] of aiExamplesStore.entries()) {
        if (example.userId === userId) {
          userExamples.push(example);
        }
      }

      res.json({
        success: true,
        data: userExamples,
        count: userExamples.length
      });

    } catch (error) {
      console.error('Error retrieving user AI examples:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI examples'
      });
    }
  }
);

module.exports = router;
