import { Recipe } from '../types';

interface Props {
  suggestions: Recipe[];
  onSelect: (recipe: Recipe) => void;
}

const SuggestionsList = ({ suggestions, onSelect }: Props) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg">
      {suggestions.map((recipe) => (
        <button
          key={recipe._id}
          onClick={() => onSelect(recipe)}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between"
        >
          <span className="font-medium">{recipe.name || 'Unnamed Recipe'}</span>
          <span className="text-sm text-gray-500">
            {recipe.ingredients?.length || 0} ingredients
          </span>
        </button>
      ))}
    </div>
  );
};

export default SuggestionsList;
