import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader, Plus } from 'lucide-react';

// Match the LLM output format
interface Ingredient {
  "Dish name": string;
  "Quantity": number;
  "Unit of Measure": string;
  "Ingredient": string;
}

interface Props {
  query: string;
  onRecipeAdded: (dishName: string) => void;
}

const AddNewRecipe = ({ query, onRecipeAdded }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = 'https://vivachef.onrender.com/api';

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Check if recipe already exists
      const response = await fetch(`${API_BASE}/recipes/suggestions?query=${query}`);
      const data = await response.json();

      if (data?.length) {
        toast.success('Recipe already exists!');
        return;
      }

      toast('Recipe not found, generating via LLM...');

      // Generate recipe via LLM
      const llmResponse = await fetch(`${API_BASE}/llm/generate-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const llmJson = await llmResponse.json();
      
      const message = llmJson?.result;

      let ingredients: Ingredient[];

      console.log('Raw LLM result message:', message);

      if (typeof message !== 'string' && !Array.isArray(message)) {
        console.error('Unexpected LLM format:', message);
        toast.error('LLM response format is invalid.');
        return;
      }

      try {
        const cleanMessage = typeof message === 'string' ? message.trim() : JSON.stringify(message);

        // Optional: try to sanitize a trailing comma or orphaned object
        const sanitized = cleanMessage.replace(/,\s*{?\s*}?\s*$/, ''); // crude but useful

        ingredients = JSON.parse(sanitized);
        console.log('✅ Parsed ingredients:', ingredients);
      } catch (parseErr) {
        console.error('❌ Failed to parse LLM response:', parseErr);
        console.error('🔍 Possibly malformed JSON string:', message);
        toast.error('LLM gave a broken response. Please try again.');

        // Show a debugging alert (optional)
        alert(`LLM response was broken:\n\n${message}`);

        return;
      }


      // Save all ingredients
      const savePromises = ingredients.map((ing) =>
        fetch(`${API_BASE}/recipes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            "Dish name": ing["Dish name"] || query,
            "Quantity": ing["Quantity"],
            "Unit of Measure": ing["Unit of Measure"],
            "Ingredients": ing.Ingredient, // should be a string
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`Failed to save ${ing.Ingredient}`);
            return res.json();
          })
          .then((savedRecipe) => {
            // Notify parent
            onRecipeAdded(savedRecipe["Dish name"]);
            return savedRecipe;
          })
          .catch((err) => {
            console.error(err);
            toast.error(`Failed to add ${ing.Ingredient}`);
            return null;
          })
      );

      const results = await Promise.all(savePromises);
      const successCount = results.filter((r) => r !== null).length;

      toast.success(`${successCount} ingredients added!`);
      
      // Get the dish name from the first ingredient and notify parent
      const lastAddedRecipe = results[results.length - 1];
      if (lastAddedRecipe) {
        onRecipeAdded(lastAddedRecipe["Dish name"]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate recipe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={handleSearch}
        disabled={isLoading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center justify-center gap-1"
      >
        {isLoading ? <Loader className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
        <span>{isLoading ? 'Generating...' : `Add "${query}" recipe`}</span>
      </button>
    </div>
  );
};

export default AddNewRecipe;
