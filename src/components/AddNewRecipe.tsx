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
      try {

        console.log('Raw LLM result message:', message);


        if (typeof message === 'string') {
          ingredients = JSON.parse(message);
        } else if (Array.isArray(message)) {
          ingredients = message;
        } else {
          throw new Error('Unexpected format from LLM');
        }
      } catch (parseErr) {
        console.error('Failed to parse LLM output:', parseErr);
        toast.error('Could not parse recipe from LLM.');
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
