// Recommended variant names per category (matched case-insensitively on category name).
// Add more entries here as the catalog grows — falls back to GENERIC_VARIANTS otherwise.
export const CATEGORY_VARIANTS = {
  "cat food": ["Chicken", "Fish", "Beef", "Kitten Formula", "Ocean Fish", "Liver"],
  "dog food": ["Chicken", "Beef", "Lamb", "Puppy Formula", "Grilled Chicken", "Mutton"],
  "bird food": ["Mixed Seeds", "Sunflower Seeds", "Millet", "Fruit Mix"],
  "fish food": ["Flakes", "Pellets", "Granules", "Color Enhancing"],
  "pet treats": ["Chicken Jerky", "Dental Chews", "Training Treats", "Biscuits"],
  "pet accessories": ["Small", "Medium", "Large", "Extra Large"],
  "cat litter": ["Clumping", "Non-Clumping", "Scented", "Unscented"],
};

export const GENERIC_VARIANTS = ["Small", "Medium", "Large", "Regular", "Value Pack"];

export function getVariantSuggestions(categoryName = "") {
  const key = categoryName.trim().toLowerCase();
  return CATEGORY_VARIANTS[key] || GENERIC_VARIANTS;
}