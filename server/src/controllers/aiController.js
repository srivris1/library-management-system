import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * AI Controller - Provides smart search and book recommendations.
 *
 * This uses an intelligent offline NLP approach that works without
 * any external API. If a GEMINI_API_KEY is configured, it uses
 * the Google Gemini API for richer natural-language understanding.
 */

// ==================== Offline Smart Search Engine ====================

/**
 * Parse a natural-language query into structured database filters.
 * Works entirely offline using keyword extraction and pattern matching.
 */
const parseNaturalLanguageQuery = (query) => {
  const normalized = query.toLowerCase().trim();
  const filters = {};
  const keywords = [];

  // Detect availability intent
  if (
    normalized.includes('available') ||
    normalized.includes('in stock') ||
    normalized.includes('can borrow') ||
    normalized.includes('not checked out') ||
    normalized.includes('free')
  ) {
    filters.availableCopies = { $gt: 0 };
  }
  if (
    normalized.includes('unavailable') ||
    normalized.includes('out of stock') ||
    normalized.includes('checked out') ||
    normalized.includes('all issued')
  ) {
    filters.availableCopies = 0;
  }

  // Detect category intent
  const categories = [
    'computer science',
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'engineering',
    'literature',
    'history',
    'philosophy',
    'economics',
    'business',
    'psychology',
    'art',
    'music',
    'fiction',
    'non-fiction',
    'reference',
    'self-help',
  ];

  for (const cat of categories) {
    if (normalized.includes(cat)) {
      filters.category = cat
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      break;
    }
  }

  // Detect subject/topic keywords
  const subjectKeywords = [
    'algorithm',
    'data structure',
    'machine learning',
    'artificial intelligence',
    'ai',
    'web development',
    'database',
    'networking',
    'operating system',
    'python',
    'java',
    'javascript',
    'react',
    'node',
    'calculus',
    'linear algebra',
    'statistics',
    'probability',
    'quantum',
    'organic chemistry',
    'genetics',
    'evolution',
    'philosophy',
    'economics',
    'marketing',
    'finance',
    'accounting',
    'psychology',
    'sociology',
    'political science',
    'novel',
    'poetry',
    'drama',
    'essay',
    'programming',
    'software engineering',
    'dsa',
    'blockchain',
    'cybersecurity',
    'cloud computing',
    'devops',
    'deep learning',
    'neural network',
    'nlp',
    'computer vision',
  ];

  for (const keyword of subjectKeywords) {
    if (normalized.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  // Detect author intent
  const authorMatch = normalized.match(
    /(?:by|author|written by|from)\s+([a-z\s.]+?)(?:\s+(?:on|about|in|that|which|$))/
  );
  if (authorMatch) {
    filters.author = { $regex: authorMatch[1].trim(), $options: 'i' };
  }

  // Build text search from remaining meaningful words
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can',
    'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between',
    'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'because', 'but',
    'and', 'or', 'if', 'while', 'about', 'me', 'my', 'i',
    'show', 'find', 'get', 'give', 'list', 'search', 'look',
    'want', 'book', 'books', 'library', 'available', 'that',
    'which', 'any', 'what',
  ]);

  const searchTerms = normalized
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const allSearchTerms = [...new Set([...keywords, ...searchTerms])];

  return { filters, searchTerms: allSearchTerms };
};

/**
 * @desc    AI-powered smart search (natural language to database query)
 * @route   POST /api/ai/smart-search
 * @body    { query: "Find me available computer science books about algorithms" }
 */
export const smartSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      throw new AppError('Search query is required', 400);
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    let results;
    let searchMethod;
    let interpretation;

    if (geminiKey && geminiKey.trim() !== '') {
      // ===== Gemini-powered search =====
      searchMethod = 'gemini-ai';
      try {
        const geminiResult = await geminiSmartSearch(query, geminiKey);
        interpretation = geminiResult.interpretation;

        const mongoQuery = buildMongoQuery(geminiResult.filters);
        results = await Book.find(mongoQuery).limit(50);
      } catch (aiError) {
        console.warn('Gemini AI search failed, falling back to offline:', aiError.message);
        // Fallback to offline
        const parsed = parseNaturalLanguageQuery(query);
        interpretation = `Searching for: ${parsed.searchTerms.join(', ')}`;
        searchMethod = 'offline-nlp-fallback';

        const mongoQuery = buildSmartQuery(parsed);
        results = await Book.find(mongoQuery).limit(50);
      }
    } else {
      // ===== Offline NLP search =====
      searchMethod = 'offline-nlp';
      const parsed = parseNaturalLanguageQuery(query);
      interpretation = `Filters applied: ${JSON.stringify(parsed.filters)}. Keywords: ${parsed.searchTerms.join(', ')}`;

      const mongoQuery = buildSmartQuery(parsed);
      results = await Book.find(mongoQuery).limit(50);
    }

    res.json({
      success: true,
      data: results,
      meta: {
        query,
        interpretation,
        searchMethod,
        resultCount: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Build MongoDB query from parsed NLP output
 */
const buildSmartQuery = (parsed) => {
  const query = { ...parsed.filters };

  if (parsed.searchTerms.length > 0) {
    const regexPattern = parsed.searchTerms.join('|');
    const searchConditions = [
      { title: { $regex: regexPattern, $options: 'i' } },
      { author: { $regex: regexPattern, $options: 'i' } },
      { description: { $regex: regexPattern, $options: 'i' } },
      { category: { $regex: regexPattern, $options: 'i' } },
    ];

    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchConditions }];
      delete query.$or;
    } else {
      query.$or = searchConditions;
    }
  }

  return query;
};

/**
 * Build MongoDB query from Gemini AI parsed filters
 */
const buildMongoQuery = (filters) => {
  const query = {};

  if (filters.category) {
    query.category = { $regex: filters.category, $options: 'i' };
  }
  if (filters.author) {
    query.author = { $regex: filters.author, $options: 'i' };
  }
  if (filters.availableOnly) {
    query.availableCopies = { $gt: 0 };
  }
  if (filters.keywords && filters.keywords.length > 0) {
    const regexPattern = filters.keywords.join('|');
    query.$or = [
      { title: { $regex: regexPattern, $options: 'i' } },
      { description: { $regex: regexPattern, $options: 'i' } },
      { author: { $regex: regexPattern, $options: 'i' } },
    ];
  }
  if (filters.title) {
    query.title = { $regex: filters.title, $options: 'i' };
  }

  return query;
};

/**
 * Use Google Gemini API to understand natural language search
 */
const geminiSmartSearch = async (userQuery, apiKey) => {
  const prompt = `You are a library catalog search assistant. Parse the following user query and extract structured search filters.

User query: "${userQuery}"

Return a JSON object with these fields (only include fields that are relevant):
{
  "category": "category name if mentioned (Computer Science, Mathematics, Physics, Chemistry, Biology, Engineering, Literature, History, Philosophy, Economics, Business, Psychology, Art, Music, Fiction, Non-Fiction, Reference, Self-Help, Other)",
  "author": "author name if mentioned",
  "title": "specific title if mentioned",
  "keywords": ["array", "of", "subject", "keywords"],
  "availableOnly": true/false (true if user wants only available books),
  "interpretation": "Brief explanation of what the user is looking for"
}

Return ONLY valid JSON, no markdown or extra text.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON in Gemini response');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    filters: parsed,
    interpretation: parsed.interpretation || 'AI-powered search',
  };
};

/**
 * @desc    AI-powered book recommendation based on borrowing history
 * @route   POST /api/ai/recommend
 * @body    { studentId: "STU001" }
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      throw new AppError('Student ID is required for recommendations', 400);
    }

    // Get borrowing history for this student
    const history = await Transaction.find({
      'borrower.studentId': studentId.toUpperCase(),
    }).sort({ createdAt: -1 });

    if (history.length === 0) {
      // No history - recommend popular books
      const popular = await Transaction.aggregate([
        { $group: { _id: '$bookId', title: { $first: '$bookTitle' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      const bookIds = popular.map((p) => p._id);
      const books = await Book.find({ bookId: { $in: bookIds }, availableCopies: { $gt: 0 } });

      return res.json({
        success: true,
        data: books,
        meta: {
          method: 'popularity-based',
          reason: 'No borrowing history found. Showing most popular available books.',
        },
      });
    }

    // Find categories the student reads most
    const borrowedBookIds = [...new Set(history.map((t) => t.bookId))];
    const borrowedBooks = await Book.find({ bookId: { $in: borrowedBookIds } });
    const categoryCounts = {};
    borrowedBooks.forEach((b) => {
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Recommend books from similar categories that haven't been borrowed
    const recommendations = await Book.find({
      category: { $in: topCategories },
      bookId: { $nin: borrowedBookIds },
      availableCopies: { $gt: 0 },
    }).limit(10);

    res.json({
      success: true,
      data: recommendations,
      meta: {
        method: 'category-affinity',
        favoriteCategories: topCategories,
        reason: `Based on your reading history, you enjoy: ${topCategories.join(', ')}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    AI auto-categorize a book based on title and description
 * @route   POST /api/ai/categorize
 * @body    { title: "...", description: "..." }
 */
export const autoCategorize = async (req, res, next) => {
  try {
    const { title, description = '' } = req.body;
    if (!title) {
      throw new AppError('Book title is required', 400);
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey.trim() !== '') {
      // Use Gemini for categorization
      try {
        const prompt = `Categorize the following book into exactly ONE of these categories:
Computer Science, Mathematics, Physics, Chemistry, Biology, Engineering, Literature, History, Philosophy, Economics, Business, Psychology, Art, Music, Fiction, Non-Fiction, Reference, Self-Help, Other

Book Title: "${title}"
${description ? `Description: "${description}"` : ''}

Return ONLY a JSON object: {"category": "Category Name", "confidence": 0.95, "tags": ["tag1", "tag2"]}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
            }),
          }
        );

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch[0]);

        return res.json({
          success: true,
          data: parsed,
          meta: { method: 'gemini-ai' },
        });
      } catch {
        // Fall through to offline
      }
    }

    // Offline keyword-based categorization
    const combined = `${title} ${description}`.toLowerCase();
    const categoryKeywords = {
      'Computer Science': ['programming', 'algorithm', 'software', 'computer', 'code', 'data structure', 'web', 'database', 'network', 'ai', 'machine learning', 'python', 'java', 'javascript', 'react', 'node', 'dsa', 'operating system', 'compiler'],
      'Mathematics': ['math', 'calculus', 'algebra', 'geometry', 'statistics', 'probability', 'theorem', 'equation', 'trigonometry', 'number theory'],
      'Physics': ['physics', 'quantum', 'mechanics', 'thermodynamics', 'electromagnetism', 'relativity', 'optics', 'particle', 'nuclear'],
      'Chemistry': ['chemistry', 'chemical', 'organic', 'inorganic', 'biochem', 'molecular', 'reaction', 'element', 'compound'],
      'Biology': ['biology', 'genetics', 'evolution', 'cell', 'anatomy', 'ecology', 'microbiology', 'botany', 'zoology', 'dna'],
      'Engineering': ['engineering', 'circuit', 'mechanical', 'electrical', 'civil', 'structural', 'design', 'manufacturing'],
      'Literature': ['literature', 'poetry', 'novel', 'drama', 'essay', 'literary', 'prose', 'narrative', 'shakespeare'],
      'History': ['history', 'historical', 'ancient', 'medieval', 'civilization', 'war', 'empire', 'revolution', 'dynasty'],
      'Philosophy': ['philosophy', 'ethics', 'logic', 'metaphysics', 'epistemology', 'existentialism', 'moral', 'plato', 'aristotle'],
      'Economics': ['economics', 'economic', 'microeconomics', 'macroeconomics', 'market', 'trade', 'gdp', 'inflation'],
      'Business': ['business', 'management', 'marketing', 'finance', 'accounting', 'entrepreneurship', 'strategy', 'mba'],
      'Psychology': ['psychology', 'cognitive', 'behavioral', 'mental', 'consciousness', 'perception', 'therapy'],
      'Fiction': ['fiction', 'novel', 'story', 'adventure', 'mystery', 'thriller', 'romance', 'fantasy', 'sci-fi', 'horror'],
      'Self-Help': ['self-help', 'motivation', 'productivity', 'habit', 'mindset', 'success', 'personal development', 'leadership'],
    };

    let bestCategory = 'Other';
    let bestScore = 0;
    const tags = [];

    for (const [category, kws] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const kw of kws) {
        if (combined.includes(kw)) {
          score++;
          tags.push(kw);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    res.json({
      success: true,
      data: {
        category: bestCategory,
        confidence: Math.min(bestScore / 3, 1),
        tags: [...new Set(tags)].slice(0, 5),
      },
      meta: { method: 'offline-keyword' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Chat with the AI Library Assistant
 * @route   POST /api/ai/chat
 * @body    { message: "How many books are overdue?" }
 */
export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      throw new AppError('Message is required', 400);
    }

    const normalized = message.toLowerCase();
    const now = new Date();

    // Library query understanding
    let response = '';

    // Stats queries
    if (normalized.includes('how many books') || normalized.includes('total books') || normalized.includes('count')) {
      const totalBooks = await Book.countDocuments();
      const totalCopies = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$totalCopies' } } }]);
      const available = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$availableCopies' } } }]);
      response = `📚 Library Stats:\n• Total unique titles: ${totalBooks}\n• Total copies: ${totalCopies[0]?.total || 0}\n• Available copies: ${available[0]?.total || 0}\n• Currently issued: ${(totalCopies[0]?.total || 0) - (available[0]?.total || 0)}`;
    }
    // Overdue queries
    else if (normalized.includes('overdue') || normalized.includes('late') || normalized.includes('penalty') || normalized.includes('fine')) {
      const overdue = await Transaction.find({ status: 'ISSUED', dueDate: { $lt: now } });
      if (overdue.length === 0) {
        response = '✅ Great news! No books are currently overdue.';
      } else {
        const totalFine = overdue.reduce((sum, t) => {
          const days = Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24));
          return sum + days * (parseInt(process.env.FINE_PER_DAY) || 5);
        }, 0);
        response = `⚠️ ${overdue.length} book(s) are currently overdue.\n• Total accumulated fines: ₹${totalFine}\n\nOverdue books:\n${overdue.map((t) => {
          const days = Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24));
          return `  - "${t.bookTitle}" (${t.bookId}) — ${days} days overdue, ₹${days * 5} fine — Borrowed by ${t.borrower.name} (${t.borrower.studentId})`;
        }).join('\n')}`;
      }
    }
    // Help / capabilities
    else if (normalized.includes('help') || normalized.includes('what can you do') || normalized.includes('capabilities')) {
      response = `🤖 I'm your Library AI Assistant! Here's what I can help with:\n\n• **Search books** — "Find available books on machine learning"\n• **Check stats** — "How many books are in the library?"\n• **Overdue info** — "Are there any overdue books?"\n• **Recommendations** — "Recommend books for a CS student"\n• **Category info** — "What categories do we have?"\n• **Book status** — "Is [book title] available?"\n\nJust ask me anything about the library!`;
    }
    // Category queries
    else if (normalized.includes('categor') || normalized.includes('genre') || normalized.includes('section')) {
      const cats = await Book.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      response = `📂 Library Categories:\n${cats.map((c) => `  • ${c._id}: ${c.count} book(s)`).join('\n')}`;
    }
    // Book availability check
    else if (normalized.includes('available') || normalized.includes('in stock')) {
      // Try to find a specific book
      const words = message.split(/\s+/).filter((w) => w.length > 3);
      const searchRegex = words.join('|');
      const books = await Book.find({
        $or: [
          { title: { $regex: searchRegex, $options: 'i' } },
          { author: { $regex: searchRegex, $options: 'i' } },
        ],
      }).limit(5);

      if (books.length > 0) {
        response = `📖 Found ${books.length} matching book(s):\n${books.map((b) => `  • "${b.title}" by ${b.author} — ${b.availableCopies}/${b.totalCopies} available ${b.availableCopies > 0 ? '✅' : '❌'}`).join('\n')}`;
      } else {
        const availCount = await Book.countDocuments({ availableCopies: { $gt: 0 } });
        const totalCount = await Book.countDocuments();
        response = `📊 ${availCount} out of ${totalCount} book titles currently have available copies. Try searching for a specific title!`;
      }
    }
    // Default fallback - try smart search
    else {
      const parsed = parseNaturalLanguageQuery(message);
      const mongoQuery = buildSmartQuery(parsed);
      const books = await Book.find(mongoQuery).limit(5);

      if (books.length > 0) {
        response = `📖 I found ${books.length} book(s) matching your query:\n${books.map((b) => `  • "${b.title}" by ${b.author} [${b.category}] — ${b.availableCopies}/${b.totalCopies} available`).join('\n')}`;
      } else {
        response = `🔍 I couldn't find any specific books matching that query. Try being more specific, or ask me:\n• "How many books are in the library?"\n• "Show available computer science books"\n• "Are there any overdue books?"`;
      }
    }

    res.json({
      success: true,
      data: {
        reply: response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { smartSearch, getRecommendations, autoCategorize, chat };
