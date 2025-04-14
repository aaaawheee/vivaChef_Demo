import { X } from 'lucide-react';
import { Recipe } from '../types';

interface Props {
  selectedRecipes: Recipe[];
  expandedRecipes: string[];
  toggleDetails: (id: string) => void;
  removeRecipe: (id: string) => void;
  formatQuantity: (qty: number | undefined) => string;
}

const SelectedRecipes = ({
  selectedRecipes,
  expandedRecipes,
  toggleDetails,
  removeRecipe,
  formatQuantity,
}: Props) => (
  <div className="mt-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">
      Selected Recipes ({selectedRecipes.length}/4)
    </h2>
    <div className="space-y-4">
      {selectedRecipes.map((recipe) => (
        <div key={recipe._id} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{recipe.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => toggleDetails(recipe._id)}
                className="text-blue-500 text-sm hover:underline"
              >
                {expandedRecipes.includes(recipe._id) ? 'Hide Details' : 'Show Details'}
              </button>
              <button
                onClick={() => removeRecipe(recipe._id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {expandedRecipes.includes(recipe._id) && (
            <div className="pl-4 text-sm text-gray-600">
              <h4 className="font-medium mb-1">Ingredients:</h4>
              <ul className="list-disc pl-4">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx}>
                    {ingredient.name} ({formatQuantity(ingredient.quantity)} {ingredient.unit})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default SelectedRecipes;
