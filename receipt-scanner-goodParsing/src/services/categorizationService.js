/**
 * Categorize a grocery item based on its name
 * @param {string} itemName - The name of the grocery item
 * @returns {string} - The category of the item
 */
function categorizeItem(itemName) {
  const name = itemName.toLowerCase();
  
  // Define categories and their keywords (expanded for Whole Foods products)
  const categories = {
    'Produce': [
      'apple', 'banana', 'orange', 'lettuce', 'tomato', 'potato', 'onion', 
      'carrot', 'broccoli', 'spinach', 'pepper', 'fruit', 'vegetable',
      'cauliflower', 'basil', 'blackberry', 'sweet potato', 'organic', 'tomato',
      'kiwi', 'berry', 'grapes', 'avocado', 'lemon', 'lime', 'produce',
      'cucumber', 'celery', 'garlic', 'ginger', 'herb', 'mushroom', 'squash',
      'zucchini', 'asparagus', 'cabbage', 'salad', 'greens', 'cilantro',
      'parsley', 'mint', 'thyme', 'rosemary', 'sage', 'radish', 'beet',
      'pear', 'plum', 'peach', 'nectarine', 'mango', 'pineapple', 'melon',
      'watermelon', 'cantaloupe', 'honeydew', 'fig', 'date', 'pomegranate'
    ],
    'Dairy': [
      'milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'fage', 'greek',
      'dairy', 'kefir', 'cottage', 'sour cream', 'half and half', 'whip',
      'creamer', 'oat milk', 'almond milk', 'soy milk', 'coconut milk',
      'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'gouda', 'brie',
      'goat cheese', 'feta', 'swiss', 'provolone', 'heavy cream'
    ],
    'Meat': [
      'chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'shrimp', 'steak', 'ground',
      'meat', 'chuck', 'ribs', 'chops', 'bacon', 'sausage', 'brisket', 'roast',
      'lamb', 'veal', 'duck', 'tuna', 'cod', 'halibut', 'tilapia', 'crab',
      'lobster', 'scallop', 'oyster', 'mussel', 'clam', 'ham', 'prosciutto',
      'salami', 'pepperoni', 'hot dog', 'bratwurst', 'chorizo', 'liver',
      'organ', 'bone', 'wing', 'thigh', 'breast', 'tenderloin', 'sirloin'
    ],
    'Bakery': [
      'bread', 'roll', 'bun', 'bagel', 'muffin', 'cake', 'cookie', 'pastry',
      'croissant', 'danish', 'baguette', 'loaf', 'sourdough', 'wheat',
      'rye', 'pumpernickel', 'brioche', 'pita', 'tortilla', 'wrap',
      'flatbread', 'naan', 'focaccia', 'ciabatta', 'english muffin',
      'donut', 'scone', 'pie', 'tart', 'brownie', 'cupcake', 'biscuit',
      'cracker', 'pretzel', 'breadstick', 'crust', 'dough'
    ],
    'Pantry': [
      'rice', 'pasta', 'cereal', 'flour', 'sugar', 'oil', 'vinegar', 'sauce', 
      'soup', 'can', 'jar', 'spice', 'bean', 'grain', 'long grain', 'cannellini',
      'canned', 'dry', 'condiment', 'seasoning', 'olive', 'mustard', 'ketchup',
      'quinoa', 'couscous', 'barley', 'oat', 'lentil', 'chickpea', 'peanut butter',
      'almond butter', 'jam', 'jelly', 'honey', 'syrup', 'salt', 'pepper',
      'cumin', 'coriander', 'paprika', 'cinnamon', 'nutmeg', 'vanilla',
      'baking powder', 'baking soda', 'yeast', 'broth', 'stock', 'tomato sauce',
      'pasta sauce', 'salsa', 'mayo', 'mayonnaise', 'dressing'
    ],
    'Snacks': [
      'chip', 'cracker', 'pretzel', 'nut', 'candy', 'chocolate', 'cookie', 'popcorn',
      'granola', 'bar', 'snack', 'trail mix', 'dried fruit', 'pita', 'tortilla',
      'almond', 'cashew', 'pistachio', 'pecan', 'walnut', 'peanut', 'macadamia',
      'raisin', 'cranberry', 'apricot', 'gummy', 'licorice', 'caramel',
      'marshmallow', 'energy bar', 'protein bar', 'rice cake', 'corn chip',
      'potato chip', 'veggie chip', 'cheese puff', 'popcorn', 'seed',
      'sunflower', 'pumpkin seed'
    ],
    'Beverages': [
      'water', 'soda', 'juice', 'coffee', 'tea', 'beer', 'wine', 'drink', 'sparkl',
      'fizz', 'sparkling', 'spring', 'milk', 'lemonade', 'energy', 'kombucha', 'mineral',
      'coconut water', 'almond milk', 'soy milk', 'oat milk', 'smoothie',
      'cider', 'punch', 'cocktail', 'mixer', 'tonic', 'ginger ale', 'cola',
      'root beer', 'sprite', 'fanta', 'pepsi', 'dr pepper', 'mountain dew',
      'gatorade', 'powerade', 'vitamin water', 'red bull', 'monster'
    ],
    'Frozen': [
      'frozen', 'ice cream', 'pizza', 'waffles', 'dessert', 'freezer', 'popsicle',
      'entree', 'frozen meal', 'sorbet', 'gelato', 'frozen yogurt',
      'frozen vegetable', 'frozen fruit', 'frozen dinner', 'frozen breakfast',
      'frozen pizza', 'frozen burger', 'frozen chicken', 'frozen fish',
      'frozen shrimp', 'frozen rice', 'frozen pasta', 'frozen soup',
      'ice pop', 'frozen pie', 'frozen cake', 'frozen bread'
    ]
  };
  
  // Check each category to see if the item matches
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  // Default category if no match is found
  return 'Other';
}

module.exports = {
  categorizeItem
}; 