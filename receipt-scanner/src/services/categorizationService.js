/**
 * Categorize a grocery item based on its name
 * @param {string} itemName - The name of the grocery item
 * @returns {string} - The category of the item
 */
function categorizeItem(itemName) {
  const name = itemName.toLowerCase();
  
  // Define categories and their keywords
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
      'watermelon', 'cantaloupe', 'honeydew', 'fig', 'date', 'pomegranate',
      'arugula', 'kale', 'romaine', 'endive', 'chicory', 'radicchio',
      'bok choy', 'brussels', 'artichoke', 'eggplant', 'leek', 'shallot',
      'scallion', 'green onion', 'chive', 'dill', 'oregano', 'tarragon',
      'lemongrass', 'fennel', 'turnip', 'rutabaga', 'parsnip', 'jicama',
      'daikon', 'kohlrabi', 'collard', 'mustard green', 'swiss chard'
    ],
    'Dairy': [
      'milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'fage', 'greek',
      'dairy', 'kefir', 'cottage', 'sour cream', 'half and half', 'whip',
      'creamer', 'oat milk', 'almond milk', 'soy milk', 'coconut milk',
      'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'gouda', 'brie',
      'goat cheese', 'feta', 'swiss', 'provolone', 'heavy cream',
      'cream cheese', 'mascarpone', 'burrata', 'halloumi', 'manchego',
      'asiago', 'fontina', 'havarti', 'colby', 'monterey jack',
      'queso', 'queso fresco', 'cotija', 'paneer', 'quark'
    ],
    'Meat': [
      'chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'shrimp', 'steak', 'ground',
      'meat', 'chuck', 'ribs', 'chops', 'bacon', 'sausage', 'brisket', 'roast',
      'lamb', 'veal', 'duck', 'tuna', 'cod', 'halibut', 'tilapia', 'crab',
      'lobster', 'scallop', 'oyster', 'mussel', 'clam', 'ham', 'prosciutto',
      'salami', 'pepperoni', 'hot dog', 'bratwurst', 'chorizo', 'liver',
      'organ', 'bone', 'wing', 'thigh', 'breast', 'tenderloin', 'sirloin',
      'ribeye', 'filet', 'strip', 'flank', 'skirt', 'round', 'loin',
      'pork chop', 'pork tenderloin', 'pork belly', 'pork shoulder',
      'chicken breast', 'chicken thigh', 'chicken wing', 'chicken leg',
      'turkey breast', 'turkey thigh', 'turkey wing', 'turkey leg',
      'ground beef', 'ground pork', 'ground turkey', 'ground chicken',
      'bacon', 'pancetta', 'guanciale', 'speck', 'mortadella',
      'fish fillet', 'fish steak', 'fish cake', 'fish stick',
      'seafood', 'shellfish', 'crustacean', 'mollusk'
    ],
    'Bakery': [
      'bread', 'roll', 'bun', 'bagel', 'muffin', 'cake', 'cookie', 'pastry',
      'croissant', 'danish', 'baguette', 'loaf', 'sourdough', 'wheat',
      'rye', 'pumpernickel', 'brioche', 'pita', 'tortilla', 'wrap',
      'flatbread', 'naan', 'focaccia', 'ciabatta', 'english muffin',
      'donut', 'scone', 'pie', 'tart', 'brownie', 'cupcake', 'biscuit',
      'cracker', 'pretzel', 'breadstick', 'crust', 'dough',
      'baguette', 'challah', 'cornbread', 'fry bread', 'lavash',
      'matzo', 'pita', 'tortilla', 'waffle', 'pancake', 'crepe',
      'biscotti', 'cannoli', 'eclair', 'macaron', 'madeleine',
      'palmier', 'profiterole', 'strudel', 'tiramisu', 'trifle'
    ],
    'Pantry': [
      'rice', 'pasta', 'cereal', 'flour', 'sugar', 'oil', 'vinegar', 'sauce', 
      'soup', 'can', 'jar', 'spice', 'bean', 'grain', 'long grain', 'cannellini',
      'canned', 'dry', 'condiment', 'seasoning', 'olive', 'mustard', 'ketchup',
      'quinoa', 'couscous', 'barley', 'oat', 'lentil', 'chickpea', 'peanut butter',
      'almond butter', 'jam', 'jelly', 'honey', 'syrup', 'salt', 'pepper',
      'cumin', 'coriander', 'paprika', 'cinnamon', 'nutmeg', 'vanilla',
      'baking powder', 'baking soda', 'yeast', 'broth', 'stock', 'tomato sauce',
      'pasta sauce', 'salsa', 'mayo', 'mayonnaise', 'dressing',
      'soy sauce', 'fish sauce', 'worcestershire', 'hot sauce', 'bbq sauce',
      'teriyaki', 'hoisin', 'oyster sauce', 'sesame oil', 'coconut oil',
      'avocado oil', 'grapeseed oil', 'canola oil', 'vegetable oil',
      'balsamic', 'red wine', 'white wine', 'apple cider', 'rice wine',
      'tahini', 'hummus', 'guacamole', 'salsa', 'pesto', 'aioli',
      'chutney', 'relish', 'pickle', 'olive', 'caper', 'anchovy'
    ],
    'Snacks': [
      'chip', 'cracker', 'pretzel', 'nut', 'candy', 'chocolate', 'cookie', 'popcorn',
      'granola', 'bar', 'snack', 'trail mix', 'dried fruit', 'pita', 'tortilla',
      'almond', 'cashew', 'pistachio', 'pecan', 'walnut', 'peanut', 'macadamia',
      'raisin', 'cranberry', 'apricot', 'gummy', 'licorice', 'caramel',
      'marshmallow', 'energy bar', 'protein bar', 'rice cake', 'corn chip',
      'potato chip', 'veggie chip', 'cheese puff', 'popcorn', 'seed',
      'sunflower', 'pumpkin seed', 'chocolate bar', 'chocolate chip',
      'dark chocolate', 'milk chocolate', 'white chocolate', 'candy bar',
      'gum', 'mint', 'hard candy', 'jelly bean', 'm&m', 'skittles',
      'twix', 'snickers', 'reeses', 'kit kat', 'hershey', 'dove',
      'granola bar', 'protein bar', 'energy bar', 'fruit bar',
      'jerky', 'beef jerky', 'turkey jerky', 'pork jerky'
    ],
    'Beverages': [
      'water', 'soda', 'juice', 'coffee', 'tea', 'beer', 'wine', 'drink', 'sparkl',
      'fizz', 'sparkling', 'spring', 'milk', 'lemonade', 'energy', 'kombucha', 'mineral',
      'coconut water', 'almond milk', 'soy milk', 'oat milk', 'smoothie',
      'cider', 'punch', 'cocktail', 'mixer', 'tonic', 'ginger ale', 'cola',
      'root beer', 'sprite', 'fanta', 'pepsi', 'dr pepper', 'mountain dew',
      'gatorade', 'powerade', 'vitamin water', 'red bull', 'monster',
      'coffee bean', 'coffee ground', 'coffee pod', 'coffee capsule',
      'tea bag', 'tea leaf', 'green tea', 'black tea', 'herbal tea',
      'oolong', 'pu-erh', 'rooibos', 'chai', 'matcha', 'yerba mate',
      'beer', 'ale', 'lager', 'stout', 'porter', 'pilsner', 'ipa',
      'wine', 'red wine', 'white wine', 'rosé', 'sparkling wine',
      'champagne', 'prosecco', 'cava', 'sake', 'mead'
    ],
    'Frozen': [
      'frozen', 'ice cream', 'pizza', 'waffles', 'dessert', 'freezer', 'popsicle',
      'entree', 'frozen meal', 'sorbet', 'gelato', 'frozen yogurt',
      'frozen vegetable', 'frozen fruit', 'frozen dinner', 'frozen breakfast',
      'frozen pizza', 'frozen burger', 'frozen chicken', 'frozen fish',
      'frozen shrimp', 'frozen rice', 'frozen pasta', 'frozen soup',
      'ice pop', 'frozen pie', 'frozen cake', 'frozen bread',
      'frozen waffle', 'frozen pancake', 'frozen french toast',
      'frozen dumpling', 'frozen potstickers', 'frozen egg roll',
      'frozen spring roll', 'frozen burrito', 'frozen enchilada',
      'frozen lasagna', 'frozen mac and cheese', 'frozen stir fry',
      'frozen curry', 'frozen pad thai', 'frozen sushi', 'frozen roll',
      'frozen fish stick', 'frozen fish fillet', 'frozen shrimp',
      'frozen scallop', 'frozen crab', 'frozen lobster',
      'frozen vegetable medley', 'frozen mixed vegetables',
      'frozen broccoli', 'frozen cauliflower', 'frozen spinach',
      'frozen corn', 'frozen pea', 'frozen carrot', 'frozen bean',
      'frozen fruit blend', 'frozen berry', 'frozen mango',
      'frozen pineapple', 'frozen banana', 'frozen strawberry',
      'frozen blueberry', 'frozen raspberry', 'frozen blackberry'
    ],
    'Prepared Foods': [
      'meal', 'entree', 'dinner', 'lunch', 'breakfast', 'sandwich', 'wrap',
      'salad', 'soup', 'bowl', 'plate', 'kit', 'box', 'tray', 'package',
      'prepared', 'ready to eat', 'ready made', 'heat and serve',
      'microwave', 'microwavable', 'steam', 'steamable', 'bake',
      'bakeable', 'grill', 'grillable', 'roast', 'roastable',
      'asian', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese',
      'indian', 'mexican', 'italian', 'mediterranean', 'greek',
      'middle eastern', 'lebanese', 'turkish', 'moroccan',
      'caribbean', 'cuban', 'puerto rican', 'jamaican',
      'southern', 'cajun', 'creole', 'soul food', 'barbecue',
      'bbq', 'grill', 'sandwich', 'sub', 'hoagie', 'hero',
      'wrap', 'burrito', 'taco', 'quesadilla', 'enchilada',
      'fajita', 'nacho', 'pizza', 'pasta', 'risotto',
      'stir fry', 'curry', 'pad thai', 'sushi', 'roll',
      'poke', 'bowl', 'grain bowl', 'power bowl', 'protein bowl',
      'salad bowl', 'soup bowl', 'noodle bowl', 'rice bowl',
      'meal kit', 'dinner kit', 'cooking kit', 'recipe kit',
      'prepared meal', 'ready meal', 'heat and serve meal',
      'microwave meal', 'frozen meal', 'refrigerated meal',
      'fresh meal', 'gourmet meal', 'organic meal', 'healthy meal',
      'diet meal', 'keto meal', 'paleo meal', 'vegan meal',
      'vegetarian meal', 'gluten free meal', 'dairy free meal'
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