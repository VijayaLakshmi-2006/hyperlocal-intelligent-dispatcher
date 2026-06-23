import express from 'express';
import { searchPrompt, getSearchHistory } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

import { parseShoppingPrompt } from '../services/aiService.js';

const router = express.Router();

router.post('/search', protect, searchPrompt);
router.get('/history', protect, getSearchHistory);
router.get('/debug', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = 'Chicken Biryani for 4 people';
    
    // Let's do a direct test of Gemini API here to see the error
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    if (!apiKey) {
      return res.json({ success: false, error: 'GEMINI_API_KEY environment variable is missing' });
    }
    
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Respond with "success"' }] }]
    });
    
    const responseText = result.response.text();
    return res.json({
      success: true,
      apiKeyPresent: !!apiKey,
      apiKeySnippet: apiKey.substring(0, 10) + '...',
      responseText
    });
  } catch (err) {
    return res.json({
      success: false,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      error: err.message,
      stack: err.stack
    });
  }
});

export default router;
