const supabase = require('../config/supabase');

const FAQ_DB = [
  { keywords: ['deposit', 'escrow', 'hold'], response: 'RentNear holds a security deposit on the renter\'s card for safety. The deposit is held in secure escrow and released within 24 hours of item return validation.' },
  { keywords: ['insurance', 'broken', 'damage'], response: 'If an item is damaged during a rental, you can file a dispute within 24 hours with pre-rental and post-rental photos. The held security deposit covers verified damages.' },
  { keywords: ['cancel', 'refund'], response: 'You receive a full refund if you cancel a booking at least 24 hours before the scheduled pickup time.' },
  { keywords: ['kyc', 'verify', 'aadhaar'], response: 'All users must complete standard identity verification (government ID scan) before listing or renting. Browse catalog items freely without verification.' }
];

const aiController = {
  // POST /api/ai/query
  queryAssistant: async (req, res, next) => {
    try {
      const { prompt } = req.body;
      const userId = req.user?.id;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: { message: 'Prompt is required.' } });
      }

      const queryLower = prompt.toLowerCase();
      let responseText = '';
      let richCards = [];
      let suggestedFollowUps = [
        'How do security deposits work?',
        'Show me trending listings near me'
      ];
      let category = 'general';

      // 1. Check for FAQ keyword matches
      const matchedFaq = FAQ_DB.find(faq => faq.keywords.some(kw => queryLower.includes(kw)));
      if (matchedFaq) {
        responseText = matchedFaq.response;
        category = 'faq';
        suggestedFollowUps = [
          'Can I cancel a booking?',
          'What happens if an item is damaged?'
        ];
      }

      // 2. Check for catalog search/recommendation intents
      // e.g. "drill", "camera under 800", "camping equipment"
      const isSearchQuery = queryLower.includes('need') || queryLower.includes('find') || queryLower.includes('rent') || queryLower.includes('projector') || queryLower.includes('camera') || queryLower.includes('drill') || queryLower.includes('equipment');
      
      if (isSearchQuery) {
        category = 'search';
        // Parse category matching terms
        let targetCategory = null;
        if (queryLower.includes('camera')) targetCategory = 'Cameras';
        else if (queryLower.includes('drill')) targetCategory = 'Tools';
        else if (queryLower.includes('projector')) targetCategory = 'Electronics';
        else if (queryLower.includes('camping')) targetCategory = 'Outdoors';

        // Parse price limits
        let priceLimit = null;
        const priceMatch = queryLower.match(/(under|below|less than)?\s*₹?\$?\s*(\d+)/);
        if (priceMatch) {
          priceLimit = parseFloat(priceMatch[2]);
        }

        // Fetch matched listings from Supabase
        let query = supabase.from('products').select('id, title, category, price_per_day, images, deposit_amount, owner_id').eq('is_available', true);
        if (targetCategory) {
          query = query.eq('category', targetCategory);
        }
        if (priceLimit) {
          query = query.lte('price_per_day', priceLimit);
        }

        const { data: products } = await query.limit(3);
        
        if (products && products.length > 0) {
          richCards = products.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            price_per_day: p.price_per_day,
            deposit_amount: p.deposit_amount,
            images: p.images
          }));
          responseText = matchedFaq 
            ? `${matchedFaq.response} Also, based on your search for "${prompt}", here are the top matched items currently available to rent:`
            : `Here are the best RentNear listings matching "${prompt}" near Bengaluru:`;
          suggestedFollowUps = [
            'What is the security deposit for these items?',
            'Who is the owner with the highest trust rating?'
          ];
        } else {
          responseText = `I searched our active neighborhood inventory for "${prompt}" but couldn't find matching available items. Would you like me to connect you to an operator?`;
        }
      }

      // 3. Trust Score Queries
      if (queryLower.includes('trust') || queryLower.includes('highest rated')) {
        category = 'trust';
        const { data: topUsers } = await supabase
          .from('users')
          .select('id, name, trust_score, rating_average')
          .order('trust_score', { ascending: false })
          .limit(1);

        if (topUsers && topUsers.length > 0) {
          responseText = `The highest trusted user in our local network is ${topUsers[0].name} with a verified Trust Score of ${topUsers[0].trust_score}/100 and average rating of ${topUsers[0].rating_average}★.`;
        }
      }

      // Default generic fallback
      if (!responseText) {
        responseText = `I\'m your RentNear AI Assistant! 🌟 I can help you find cheap item listings, explain security deposits, or simulate pricing. Try asking me "find a camera under $80".`;
      }

      // 4. Log interaction in DB
      await supabase.from('ai_interactions').insert([{
        user_id: userId || null,
        prompt,
        response: responseText,
        token_count: prompt.length + responseText.length,
        cost: 0.00015, // Mock API cost log
        category
      }]).catch(err => console.error('AI telemetry log failed:', err));

      res.json({
        success: true,
        response: responseText,
        richCards,
        suggestedFollowUps
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/admin/ai/usage
  getAiAnalytics: async (req, res, next) => {
    try {
      const { data: logs, error } = await supabase
        .from('ai_interactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let totalCost = 0;
      let totalTokens = 0;
      (logs || []).forEach(log => {
        totalCost += parseFloat(log.cost || 0);
        totalTokens += parseInt(log.token_count || 0, 10);
      });

      res.json({
        success: true,
        totalQueries: logs ? logs.length : 0,
        totalCost: parseFloat(totalCost.toFixed(5)),
        totalTokens,
        logs: logs || []
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = aiController;
