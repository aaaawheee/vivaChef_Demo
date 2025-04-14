export interface Recipe {
  _id: string;
  name: string;
  ingredients: Ingredient[];
  created_at: string;
  user_id: string;
}

export interface Ingredient {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface SelectedRecipe {
  _id: string;
  name: string;
}