import { ShoppingCart } from 'lucide-react';

interface Props {
  groceryList: Record<string, { quantity: number; unit: string }>;
  formatQuantity: (qty: number | undefined) => string;
}

const GroceryList = ({ groceryList, formatQuantity }: Props) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">Consolidated Grocery List</h2>
      <ShoppingCart className="h-5 w-5 text-gray-500" />
    </div>

    <div className="divide-y divide-gray-200">
      {Object.entries(groceryList).map(([ingredient, details]) => (
        <div key={ingredient} className="py-2 flex justify-between items-center">
          <span>{ingredient}</span>
          <span className="text-gray-600">
            {formatQuantity(details.quantity)} {details.unit}
          </span>
        </div>
      ))}
      {Object.keys(groceryList).length === 0 && (
        <p className="text-gray-500 text-center py-4">Select recipes to see your grocery list</p>
      )}
    </div>
  </div>
);

export default GroceryList;
