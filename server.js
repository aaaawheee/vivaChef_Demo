import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Recipe Schema
const recipeSchema = new mongoose.Schema({
  "Dish name": { type: String, required: true },
  "Quantity": { type: Number },
  "Unit of Measure": { type: String },
  "Ingredients": { type: String },
  created_at: { type: Date, default: Date.now },
  user_id: String
});

// Create text index for search
recipeSchema.index({ "Dish name": 'text' });

const Recipe = mongoose.model('Recipe', recipeSchema, 'recipe_db');

// Get recipe suggestions as you type
// Get recipe suggestions grouped by Dish name
app.get('/api/recipes/suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const recipes = await Recipe.find(
      { "Dish name": { $regex: query, $options: 'i' } }
    );

    // Group by dish name
    const grouped = {};
    for (const recipe of recipes) {
      const name = recipe["Dish name"];
      if (!grouped[name]) {
        grouped[name] = {
          _id: name, // Use dish name as ID
          name,
          ingredients: []
        };
      }

      // Ingredients is always an array, but sometimes empty
      //const ingredientList = recipe.Ingredients?.length ? recipe.Ingredients : [];

      grouped[name].ingredients.push({
        name: recipe.Ingredients,
        quantity: recipe.Quantity || 0,
        unit: recipe["Unit of Measure"] || ''
      });
    }

    // Return max 5 matches
    const suggestions = Object.values(grouped).slice(0, 5);
    res.json(suggestions);
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({ error: 'Error getting suggestions' });
  }
});


// Get top dishes grouped by name with full recipe details
app.get('/api/recipes/top-dishes', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }

    const recipes = await Recipe.find(
      { "Dish name": { $regex: query, $options: 'i' } }
    );

    // Group recipes by dish name and get full details
    const dishGroups = recipes.reduce((groups, recipe) => {
      const name = recipe["Dish name"];
      if (!groups[name]) {
        groups[name] = {
          name,
          count: 0,
          recipes: []
        };
      }
      groups[name].count++;
      groups[name].recipes.push({
        _id: recipe._id,
        name: recipe["Dish name"],
        ingredients: recipe.Ingredients.map(ingredient => ({
          name: ingredient,
          quantity: recipe.Quantity,
          unit: recipe["Unit of Measure"]
        }))
      });
      return groups;
    }, {});

    const topDishes = Object.values(dishGroups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json(topDishes);
  } catch (error) {
    res.status(500).json({ error: 'Error getting top dishes' });
  }
});

// Search recipes
app.get('/api/recipes/search', async (req, res) => {
  try {
    const { query } = req.query;
    const recipes = await Recipe.find(
      { "Dish name": { $regex: query, $options: 'i' } }
    );
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Error searching recipes' });
  }
});

//FOR TESTING Render SERVER
app.get('/api/test-mongo', async (req, res) => {
  try {
    const count = await Recipe.countDocuments();
    const sample = await Recipe.find().limit(3).select("Dish name");

    res.json({
      message: "MongoDB is working!",
      totalDocuments: count,
      sampleDishes: sample
    });
  } catch (err) {
    console.error('MongoDB test error:', err);
    res.status(500).send('MongoDB not working');
  }
});



app.post('/api/recipes', async (req, res) => {
  try {
    console.log('Incoming POST body:', req.body);
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Error creating recipe' });
  }
});

app.post('/api/llm/generate-recipe', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const prompt = `Please provide a recipe for "${query}" for 8 people, in the following JSON array format:
                  [
                    {
                      "Dish name": "${query}",
                      "Quantity": number,
                      "Unit of Measure": string (use "cup", "tsp", "tbsp", or leave empty for spices like saffron),
                      "Ingredient": name of the ingredient
                    },
                    ...
                  ]

                  Respond **only** with the array of JSON objects, **without any extra explanation** or text outside the JSON.
                  `;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const json = await response.json();
    const message = json?.content?.[0]?.text;

    if (!message) {
      throw new Error('No content returned from Claude');
    }

    res.json({ result: message });
  } catch (err) {
    console.error('Claude API error:', err);
    res.status(500).json({ error: 'LLM generation failed' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});