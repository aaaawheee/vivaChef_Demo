import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import SuggestionsList from './components/SuggestionList';
import SelectedRecipes from './components/SelectedRecipe';
import GroceryList from './components/GroceryList';
import type { Recipe } from './types';
import AddNewRecipe from './components/AddNewRecipe';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  // state management
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [expandedRecipes, setExpandedRecipes] = useState<string[]>([]);
  const [groceryList, setGroceryList] = useState<Record<string, { quantity: number; unit: string }>>({});

  // format helper
  const formatQuantity = (quantity: number | undefined) =>
    !quantity || quantity < 0.001 ? 'As per taste' : parseFloat(quantity.toFixed(2)).toString();

  // fetch suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/recipes/suggestions?query=${searchQuery}`);
        const data = await response.json();
        setSuggestions(data);
      } catch {
        toast.error('Error fetching suggestions');
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // recipe selection
  const handleRecipeSelect = async (recipe: Recipe) => {
    // Prevent adding duplicate recipes
    if (selectedRecipes.some(r => r._id === recipe._id)) {
      toast.error('Recipe already selected');
      return;
    }

    if (selectedRecipes.length >= 4) {
      toast.error('Max 4 recipes allowed');
      return;
    }

    // Add the recipe
    const updatedSelectedRecipes = [...selectedRecipes, recipe];
    setSelectedRecipes(updatedSelectedRecipes);
    updateGroceryList(recipe);

    setSearchQuery('');
    setSuggestions([]);
  };

  const updateGroceryList = (recipe: Recipe) => {
    const updated = { ...groceryList };
    recipe.ingredients.forEach(({ name, quantity = 0, unit = '' }) => {
      updated[name] = updated[name]
        ? { ...updated[name], quantity: updated[name].quantity + quantity }
        : { quantity, unit };
    });
    setGroceryList(updated);
  };

  const removeRecipe = (id: string) => {
    const recipe = selectedRecipes.find(r => r._id === id);
    if (!recipe) return;

    const updated = { ...groceryList };
    recipe.ingredients.forEach(({ name, quantity = 0 }) => {
      if (updated[name]) {
        updated[name].quantity -= quantity;
        if (updated[name].quantity < 0.001) delete updated[name];
        else updated[name].quantity = parseFloat(updated[name].quantity.toFixed(4));
      }
    });

    setSelectedRecipes(prev => prev.filter(r => r._id !== id));
    setExpandedRecipes(prev => prev.filter(rid => rid !== id));
    setGroceryList(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="relative">
            <div className="sticky top-0 z-50 bg-gray-50 pb-4">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              <SuggestionsList suggestions={suggestions} onSelect={handleRecipeSelect} />
              {searchQuery.length > 2 && suggestions.length === 0 && (
                <AddNewRecipe
                  query={searchQuery}
                  onRecipeAdded={async (dishName) => {
                    try {
                      const response = await fetch(`${API_URL}/recipes/suggestions?query=${encodeURIComponent(dishName)}`);
                      if (!response.ok) throw new Error('Failed to fetch new recipe');
                      const recipes = await response.json();
                      if (recipes && recipes.length > 0) {
                        handleRecipeSelect(recipes[0]);
                        setSearchQuery('');
                      } else {
                        throw new Error('Recipe not found after adding');
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error('Failed to fetch newly added recipe');
                    }
                  }}
                />
              )}
            </div>
            <SelectedRecipes
              selectedRecipes={selectedRecipes}
              expandedRecipes={expandedRecipes}
              toggleDetails={(id) =>
                setExpandedRecipes(prev =>
                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                )
              }
              removeRecipe={removeRecipe}
              formatQuantity={formatQuantity}
            />
          </div>
          <div className="relative">
            <div className="sticky top-0">
              <GroceryList groceryList={groceryList} formatQuantity={formatQuantity} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
