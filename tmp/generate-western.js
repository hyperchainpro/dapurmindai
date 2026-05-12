// Generator script for 300 Western cuisine recipes
const fs = require('fs');

const difficulties = ['Mudah', 'Sedang', 'Susah'];
const westernEmojis = ['🍕','🍝','🍔','🥪','🌮','🥘','🍳','🧁','🍰','🥧','🌭','🧀','🥐','🥖','🥙','🍖','🥟','🥩','🥓','🥞','🧇','🫕','🥗','🥫'];

const categories = ['Western'];
const difficulties_weight = { Mudah: 0.4, Sedang: 0.4, Susah: 0.2 };
const mealTypes = ['Sarapan', 'Makan Siang', 'Makan Malam', 'Snack', 'Dessert', 'Minuman'];

// Recipe templates organized by type
const breakfastRecipes = [
  { name: 'Classic Pancakes', desc: 'Pancake tebal dan fluffy yang lembut, disajikan dengan maple syrup dan butter.', emoji: '🥞', cal: 350 },
  { name: 'French Toast', desc: 'Roti telur panggang dengan taburan gula bubuk dan madu.', emoji: '🥖', cal: 380 },
  { name: 'Eggs Benedict', desc: 'Telur poached di atas muffin Inggris dengan saus hollandaise.', emoji: '🍳', cal: 420 },
  { name: 'Belgian Waffles', desc: 'Waffle Belgia renyah dengan whipped cream dan buah segar.', emoji: '🧇', cal: 410 },
  { name: 'Scrambled Eggs', desc: 'Telur orak-arik lembut dengan keju cheddar dan bawang panggang.', emoji: '🍳', cal: 280 },
  { name: 'Omelette Classic', desc: 'Omelette dengan isian jamur, keju, dan paprika.', emoji: '🍳', cal: 320 },
  { name: 'Avocado Toast', desc: 'Toast sourdough dengan alpukat tumbuk, telur mata sapi, dan chili flakes.', emoji: '🥑', cal: 350 },
  { name: 'Breakfast Burrito', desc: 'Tortilla berisi telur, sosis, keju, dan salsa.', emoji: '🌮', cal: 480 },
  { name: 'Corned Beef Hash', desc: 'Corned beef goreng dengan kentang dan telur mata sapi.', emoji: '🥘', cal: 450 },
  { name: 'Cinnamon Rolls', desc: 'Roti gulung kayu manis dengan cream cheese frosting.', emoji: '🧁', cal: 420 },
  { name: 'Croissant Butter', desc: 'Croissant mentega renyah berlapis-lapis asal Prancis.', emoji: '🥐', cal: 310 },
  { name: 'Granola Yogurt Bowl', desc: 'Yogurt Yunani dengan granola, madu, dan buah berry segar.', emoji: '🥣', cal: 280 },
  { name: 'Bacon & Eggs', desc: 'Bacon goreng renyah dengan telur goreng mata sapi.', emoji: '🥓', cal: 380 },
  { name: 'Bagel with Cream Cheese', desc: 'Bagel panggang dengan krim keju dan irisan salmon asap.', emoji: '🥯', cal: 340 },
  { name: 'Smoothie Bowl', desc: 'Smoothie acai tebal dengan topping granola, pisang, dan chia seed.', emoji: '🫐', cal: 260 },
  { name: 'Egg Muffins', desc: 'Muffin telur dengan sayuran dan keju, cocok untuk meal prep.', emoji: '🧁', cal: 220 },
  { name: 'Hash Browns', desc: 'Kentang parut goreng renyah yang golden dan crispy.', emoji: '🥔', cal: 320 },
  { name: 'Quiche Lorraine', desc: 'Pie telur Prancis dengan bacon dan keju Gruyere.', emoji: '🥧', cal: 380 },
  { name: 'Bircher Muesli', desc: 'Muesli rendaman semalam dengan yogurt dan buah segar.', emoji: '🥣', cal: 290 },
  { name: 'Scone with Clotted Cream', desc: 'Scone Inggris hangat dengan clotted cream dan selai.', emoji: '🧁', cal: 360 },
  { name: 'Shakshuka', desc: 'Telur dimasak dalam saus tomat pedas dengan paprika dan jintan.', emoji: '🍳', cal: 310 },
  { name: 'Banana Bread', desc: 'Roti pisang lembap dengan kacang walnut dan kayu manis.', emoji: '🍌', cal: 340 },
  { name: 'Dutch Baby Pancake', desc: 'Pancake panggang oven yang mengembang besar, dengan lemon dan gula.', emoji: '🥞', cal: 370 },
  { name: 'Breakfast Casserole', desc: 'Kaser sarapan dengan roti, telur, sosis, dan keju.', emoji: '🥘', cal: 420 },
  { name: 'Pain au Chocolat', desc: 'Roti croissant Prancis dengan isi coklat leleh.', emoji: '🍫', cal: 330 },
  { name: 'English Muffin', desc: 'English muffin panggang dengan mentega dan selai.', emoji: '🍞', cal: 240 },
  { name: 'Crepe Suzette', desc: 'Crepe tipis Prancis dengan saus jeruk dan Grand Marnier.', emoji: '🥞', cal: 320 },
  { name: 'Poached Eggs on Toast', desc: 'Telur poached di atas toast mentega dengan hollandaise.', emoji: '🍞', cal: 290 },
  { name: 'Frittata Italiana', desc: 'Frittata Italia dengan zucchini, tomat, dan mozzarella.', emoji: '🍳', cal: 310 },
  { name: 'Brioche French Toast', desc: 'French toast dari roti brioche dengan custard vanilla.', emoji: '🍞', cal: 390 },
  { name: 'Chia Seed Pudding', desc: 'Pudding chia seed dengan susu almond dan madu.', emoji: '🍮', cal: 200 },
  { name: 'Acai Bowl', desc: 'Bowl acai berry beku diblender dengan topping buah segar.', emoji: '🫐', cal: 280 },
  { name: 'Overnight Oats', desc: 'Oatmeal rendaman semalam dengan susu dan buah potong.', emoji: '🥣', cal: 300 },
  { name: 'Egg Sandwich', desc: 'Sandwich telur goreng dengan keju dan bacon.', emoji: '🥪', cal: 400 },
  { name: 'Monkey Bread', desc: 'Roti tarik manis dengan mentega dan kayu manis.', emoji: '🍞', cal: 380 },
  { name: 'Blueberry Muffins', desc: 'Muffin blueberry lembut dengan crumble topping.', emoji: '🧁', cal: 310 },
  { name: 'Apple Turnover', desc: 'Pastry apel dengan isian apple pie dan gula.', emoji: '🥧', cal: 350 },
  { name: 'Beef Wellington Breakfast', desc: 'Daging sapi bungkus puff pastry untuk sarapan mewah.', emoji: '🥩', cal: 520 },
  { name: 'Potato Pancakes', desc: 'Latke kentang goreng renyah dengan sour cream dan applesauce.', emoji: '🥔', cal: 340 },
  { name: 'Yogurt Parfait', desc: 'Layer yogurt, granola, dan buah segar dalam gelas.', emoji: '🥣', cal: 250 },
  { name: 'Southern Biscuits & Gravy', desc: 'Biskuit Amerika dengan sausage gravy pedas.', emoji: '🥘', cal: 480 },
  { name: 'Smoked Salmon Bagel', desc: 'Bagel dengan salmon asap, krim keju, dan kapur.', emoji: '🥯', cal: 370 },
  { name: 'German Pancake', desc: 'Pancake oven ala Jerman yang mengembang di pinggiran.', emoji: '🥞', cal: 360 },
  { name: 'Veggie Omelette', desc: 'Omelette sayuran dengan paprika, jamur, dan bayam.', emoji: '🍳', cal: 280 },
  { name: 'Toast with Jam', desc: 'Toast mentega dengan selai buah homemade.', emoji: '🍞', cal: 200 },
  { name: 'Crêpes Nutella', desc: 'Crêpe Prancis dengan olesan Nutella dan pisang.', emoji: '🥞', cal: 400 },
  { name: 'Migas', desc: 'Telur dengan tortilla chips, cabai, dan keju khas Meksiko.', emoji: '🌮', cal: 340 },
  { name: 'Black Pudding', desc: 'Sosis darah Inggris yang digoreng renyah.', emoji: '🌭', cal: 290 },
  { name: 'Scones with Jam', desc: 'Scone gandum utuh dengan selai stroberi.', emoji: '🧁', cal: 310 },
];

const lunchRecipes = [
  { name: 'Caesar Salad', desc: 'Salad romaine dengan crouton, parmesan, dan caesar dressing.', emoji: '🥗', cal: 280 },
  { name: 'Club Sandwich', desc: 'Triple decker sandwich dengan ayam, bacon, telur, dan sayuran.', emoji: '🥪', cal: 480 },
  { name: 'Fish and Chips', desc: 'Ikan kod goreng tepung renyah dengan kentang goreng.', emoji: '🐟', cal: 560 },
  { name: 'Grilled Cheese Sandwich', desc: 'Sandwich keju goreng dengan roti sourdough dan tomat.', emoji: '🥪', cal: 420 },
  { name: 'Tomato Soup', desc: 'Sup tomat krim yang hangat dengan grilled cheese crouton.', emoji: '🍲', cal: 220 },
  { name: 'Chicken Caesar Wrap', desc: 'Tortilla wrap berisi ayam panggang dan salad Caesar.', emoji: '🌯', cal: 380 },
  { name: 'Tuna Melt', desc: 'Sandwich tuna dengan keju yang dipanggang hingga meleleh.', emoji: '🥪', cal: 420 },
  { name: 'Loaded Baked Potato', desc: 'Kentang panggang dengan butter, sour cream, keju, dan bacon.', emoji: '🥔', cal: 450 },
  { name: 'Mac and Cheese', desc: 'Makaroni dengan saus keju cheddar yang creamy.', emoji: '🧀', cal: 480 },
  { name: 'French Onion Soup', desc: 'Sup bawang Prancis dengan crouton dan keju Gruyere leleh.', emoji: '🍲', cal: 310 },
  { name: 'Reuben Sandwich', desc: 'Sandwich corned beef dengan sauerkraut dan Swiss cheese.', emoji: '🥪', cal: 490 },
  { name: 'BLT Sandwich', desc: 'Bacon, lettuce, tomato sandwich klasik.', emoji: '🥪', cal: 380 },
  { name: 'Greek Salad', desc: 'Salad Yunani dengan feta, olive, tomat, dan cucumber.', emoji: '🥗', cal: 260 },
  { name: 'Chicken Nuggets', desc: 'Nugget ayam homemade dengan saus barbekyu.', emoji: '🍗', cal: 420 },
  { name: 'Lobster Roll', desc: 'Roti hot dog berisi daging lobster dengan mayo dan celery.', emoji: '🌭', cal: 380 },
  { name: 'Poke Bowl', desc: 'Bowl nasi dengan salmon mentah, edamame, dan alpukat.', emoji: '🥣', cal: 420 },
  { name: 'Pizza Margherita', desc: 'Pizza klasik dengan saus tomat, mozzarella, dan basil.', emoji: '🍕', cal: 440 },
  { name: 'Spaghetti Bolognese', desc: 'Spaghetti dengan saus daging sapi tomat kaya rasa.', emoji: '🍝', cal: 520 },
  { name: 'Hamburger', desc: 'Burger daging sapi dengan lettuce, tomato, pickles, dan mayo.', emoji: '🍔', cal: 520 },
  { name: 'Tacos al Pastor', desc: 'Taco daging babi panggang dengan nanas dan salsa.', emoji: '🌮', cal: 380 },
  { name: 'Shepherd\'s Pie', desc: 'Pie daging domba dengan kentang mashed di atas.', emoji: '🥧', cal: 480 },
  { name: 'Grilled Chicken Salad', desc: 'Salad ayam panggang dengan vinaigrette lemon.', emoji: '🥗', cal: 320 },
  { name: 'Hot Dog Chicago', desc: 'Sosis sapi gaya Chicago dengan topping sayuran.', emoji: '🌭', cal: 380 },
  { name: 'Lasagna', desc: 'Lasagna berlapis dengan saus tomat, daging, dan bechamel.', emoji: '🍝', cal: 560 },
  { name: 'Chicken Pot Pie', desc: 'Pie ayam dengan sayuran dalam saus krim.', emoji: '🥧', cal: 460 },
  { name: 'Cobb Salad', desc: 'Salad dengan ayam, telur, bacon, alpukat, dan blue cheese.', emoji: '🥗', cal: 380 },
  { name: 'Panini Caprese', desc: 'Panini mozzarella, tomat, dan basil pesto.', emoji: '🥪', cal: 380 },
  { name: 'Nachos Supreme', desc: 'Tortilla chips dengan keju leleh, salsa, dan sour cream.', emoji: '🧀', cal: 520 },
  { name: 'Beef Tacos', desc: 'Taco daging sapi cincang dengan sayuran dan salsa.', emoji: '🌮', cal: 380 },
  { name: 'Crispy Chicken Sandwich', desc: 'Sandwich ayam goreng crispy dengan pickles dan mayo.', emoji: '🍔', cal: 530 },
  { name: 'Minestrone Soup', desc: 'Sup sayuran Italia dengan pasta dan kacang merah.', emoji: '🍲', cal: 240 },
  { name: 'Pastrami on Rye', desc: 'Sandwich pastrami dengan mustard di atas roti rye.', emoji: '🥪', cal: 440 },
  { name: 'Calzone', desc: 'Pizza lipat berisi keju, ham, dan sayuran.', emoji: '🍕', cal: 520 },
  { name: 'Thai Peanut Noodles', desc: 'Mie dengan saus kacang, sayuran, dan ayam.', emoji: '🍜', cal: 450 },
  { name: 'Stuffed Bell Peppers', desc: 'Paprika isi daging sapi dan nasi dengan keju di atas.', emoji: '🫑', cal: 380 },
  { name: 'Chicken Quesadilla', desc: 'Tortilla goreng berisi ayam, keju, dan sayuran.', emoji: '🧀', cal: 440 },
  { name: 'Mushroom Soup', desc: 'Sup jamur krim dengan bawang putih dan thyme.', emoji: '🍲', cal: 220 },
  { name: 'Fried Rice', desc: 'Nasi goreng Western dengan telur, sayuran, dan kecap.', emoji: '🍚', cal: 420 },
  { name: 'Pulled Pork Sandwich', desc: 'Daging babi suwir slow-cooked dengan coleslaw.', emoji: '🥪', cal: 490 },
  { name: 'Falafel Wrap', desc: 'Tortilla wrap dengan falafel, hummus, dan sayuran.', emoji: '🌯', cal: 360 },
  { name: 'Fish Tacos', desc: 'Taco ikan goreng dengan slaw dan salsa verde.', emoji: '🌮', cal: 340 },
  { name: 'Risotto Mushroom', desc: 'Risotto jamur Italia dengan parmesan dan white wine.', emoji: '🍚', cal: 460 },
  { name: 'Sloppy Joe', desc: 'Roti hamburger dengan daging sapi saus tomat pedas.', emoji: '🍔', cal: 480 },
  { name: 'Broccoli Cheddar Soup', desc: 'Sup brokoli dengan keju cheddar dan crouton.', emoji: '🍲', cal: 260 },
  { name: 'Steak Sandwich', desc: 'Sandwich daging steak iris dengan paprika dan bawang.', emoji: '🥪', cal: 520 },
  { name: 'Quinoa Salad', desc: 'Salad quinoa dengan sayuran segar dan lemon vinaigrette.', emoji: '🥗', cal: 280 },
  { name: 'BBQ Chicken Pizza', desc: 'Pizza dengan saus BBQ, ayam, dan bawang merah.', emoji: '🍕', cal: 480 },
  { name: 'Italian Sub', desc: 'Sandwich Italia dengan salami, ham, prosciutto, dan provolone.', emoji: '🥪', cal: 500 },
  { name: 'Vegetable Stir Fry', desc: 'Tumis sayuran dengan saus teriyaki dan nasi.', emoji: '🥘', cal: 320 },
  { name: 'Tuna Nicoise Salad', desc: 'Salad Prancis dengan tuna, telur, kacang hijau, dan olive.', emoji: '🥗', cal: 350 },
  { name: 'Grilled Veggie Wrap', desc: 'Wrap sayuran panggang dengan hummus dan feta.', emoji: '🌯', cal: 300 },
  { name: 'Chili Con Carne', desc: 'Chili daging sapi dengan kacang merah dan keju.', emoji: '🥘', cal: 420 },
  { name: 'Clam Chowder', desc: 'Sup kerang krim dengan kentang dan bacon.', emoji: '🍲', cal: 340 },
  { name: 'Banh Mi', desc: 'Sandwich Vietnam dengan daging panggang dan sayuran acar.', emoji: '🥪', cal: 400 },
  { name: 'Pasta Primavera', desc: 'Pasta dengan sayuran segar dan saus krim lemon.', emoji: '🍝', cal: 440 },
  { name: 'Cuban Sandwich', desc: 'Sandwich Kuba dengan ham, daging babi, pickles, dan mustard.', emoji: '🥪', cal: 480 },
  { name: 'Chicken Noodle Soup', desc: 'Sup ayam dengan mie, wortel, seledri, dan daging ayam.', emoji: '🍲', cal: 260 },
  { name: 'Tartare Burger', desc: 'Burger daging sapi segar dengan kuning telur dan capers.', emoji: '🍔', cal: 460 },
  { name: 'Grilled Salmon', desc: 'Salmon panggang dengan saus lemon dill dan sayuran.', emoji: '🐟', cal: 380 },
  { name: 'Beef Stew', desc: 'Semur daging sapi dengan kentang, wortel, dan seledri.', emoji: '🍲', cal: 420 },
  { name: 'Margherita Flatbread', desc: 'Flatbread pizza dengan tomat, mozzarella, dan basil.', emoji: '🍕', cal: 380 },
  { name: 'BLT Wrap', desc: 'Tortilla wrap dengan bacon, lettuce, tomat, dan mayo.', emoji: '🌯', cal: 360 },
  { name: 'Mushroom Swiss Burger', desc: 'Burger dengan topping jamur dan Swiss cheese.', emoji: '🍔', cal: 500 },
  { name: 'Tom Yum Soup', desc: 'Sup asam pedas Thailand dengan udang dan jamur.', emoji: '🍲', cal: 220 },
];

const dinnerRecipes = [
  { name: 'Steak Ribeye', desc: 'Steak ribeye panggang medium rare dengan garlic butter.', emoji: '🥩', cal: 580 },
  { name: 'Grilled Salmon Fillet', desc: 'Salmon fillet panggang dengan glaze maple dan mustard.', emoji: '🐟', cal: 420 },
  { name: 'Roast Chicken', desc: 'Ayam panggang utuh dengan herbs dan kentang roast.', emoji: '🍗', cal: 480 },
  { name: 'Beef Wellington', desc: 'Daging sapi filet dibungkus puff pastry dan duxelles.', emoji: '🥩', cal: 650 },
  { name: 'Lamb Chops', desc: 'Cincin daging domba panggang dengan rosemary dan garlic.', emoji: '🍖', cal: 520 },
  { name: 'Chicken Parmesan', desc: 'Ayam goreng tepung dengan saus tomat dan mozzarella.', emoji: '🍗', cal: 520 },
  { name: 'Pan-Seared Duck Breast', desc: 'Dada bebek panggang dengan saus orange glaze.', emoji: '🍖', cal: 480 },
  { name: 'BBQ Ribs', desc: 'Tulang rusuk babi BBQ slow-cooked dengan saus smoky.', emoji: '🍖', cal: 680 },
  { name: 'Fish and Chips Classic', desc: 'Ikan kod dalam adonan renyah dengan kentang goreng dan mushy peas.', emoji: '🐟', cal: 580 },
  { name: 'Pasta Carbonara', desc: 'Spaghetti dengan saus telur, guanciale, dan pecorino.', emoji: '🍝', cal: 520 },
  { name: 'Grilled Ribeye Steak', desc: 'Ribeye steak premium panggang dengan saus peppercorn.', emoji: '🥩', cal: 620 },
  { name: 'Roast Beef', desc: 'Daging sapi panggang medium rare dengan Yorkshire pudding.', emoji: '🥩', cal: 560 },
  { name: 'Baked Lasagna', desc: 'Lasagna berlapis dengan saus bolognese dan bechamel.', emoji: '🍝', cal: 580 },
  { name: 'Shrimp Scampi', desc: 'Udang goreng butter dengan garlic, wine, dan pasta.', emoji: '🦐', cal: 440 },
  { name: 'Pot Roast', desc: 'Semur daging sapi panggang lambat dengan sayuran.', emoji: '🥘', cal: 520 },
  { name: 'Chicken Cordon Bleu', desc: 'Ayam gulung berisi ham dan keju, dibalut tepung roti.', emoji: '🍗', cal: 540 },
  { name: 'Herb-Crusted Rack of Lamb', desc: 'Rack of lamb dengan crust herbs dan mint sauce.', emoji: '🍖', cal: 560 },
  { name: 'Pork Chops with Apples', desc: 'Pork chop panggang dengan saus apel dan kayu manis.', emoji: '🍖', cal: 420 },
  { name: 'Beef Stroganoff', desc: 'Daging sapi dengan saus krim jamur dan egg noodles.', emoji: '🥘', cal: 520 },
  { name: 'Chicken Tikka Masala', desc: 'Ayam dalam saus kari tomat krim khas India-Inggris.', emoji: '🍛', cal: 480 },
  { name: 'Filet Mignon', desc: 'Steak filet mignon lembut dengan truffle butter.', emoji: '🥩', cal: 480 },
  { name: 'Pesto Pasta with Chicken', desc: 'Pasta pesto basil dengan ayam panggang dan cherry tomato.', emoji: '🍝', cal: 480 },
  { name: 'Grilled Sea Bass', desc: 'Sea bass panggang dengan saus lemon caper.', emoji: '🐟', cal: 360 },
  { name: 'Osso Buco', desc: 'Sandung lamur sapi panggang lambat dengan gremolata.', emoji: '🥘', cal: 580 },
  { name: 'T-Bone Steak', desc: 'T-bone steak panggang dengan saus mushroom.', emoji: '🥩', cal: 620 },
  { name: 'Jambalaya', desc: 'Nasi campuran daging, udang, dan sayuran khas Louisiana.', emoji: '🥘', cal: 520 },
  { name: 'Coq au Vin', desc: 'Ayam dimasak dalam anggur merah dengan bacon dan jamur.', emoji: '🍗', cal: 480 },
  { name: 'Bouillabaisse', desc: 'Sup ikan laut Prancis dengan saffron dan rouille.', emoji: '🍲', cal: 380 },
  { name: 'Chicken Alfredo', desc: 'Pasta fettuccine dengan saus krim parmesan dan ayam.', emoji: '🍝', cal: 560 },
  { name: 'Beef Bourguignon', desc: 'Daging sapi dimasak dalam anggur merah Burgundy.', emoji: '🥘', cal: 520 },
  { name: 'Grilled Swordfish', desc: 'Pedang panggang dengan Mediterranean salsa.', emoji: '🐟', cal: 400 },
  { name: 'Meatloaf', desc: 'Roti daging sapi dengan saus tomat glaze.', emoji: '🥘', cal: 480 },
  { name: 'Fajitas', desc: 'Daging dan sayuran panggang dengan tortilla dan salsa.', emoji: '🌮', cal: 440 },
  { name: 'Prawn Risotto', desc: 'Risotto udang dengan saffron dan parmesan.', emoji: '🍚', cal: 480 },
  { name: 'Pork Tenderloin', desc: 'Daging babi tenderloin panggang dengan saus apel.', emoji: '🍖', cal: 380 },
  { name: 'Baked Ziti', desc: 'Ziti panggang dengan saus tomat dan keju mozzarella.', emoji: '🍝', cal: 520 },
  { name: 'Moussaka', desc: 'Terong dan daging domba berlapis dengan bechamel khas Yunani.', emoji: '🥘', cal: 460 },
  { name: 'Roast Turkey', desc: 'Kalkun panggang dengan stuffing dan gravy.', emoji: '🦃', cal: 520 },
  { name: 'Beef Tacos Supreme', desc: 'Taco daging sapi premium dengan guacamole dan sour cream.', emoji: '🌮', cal: 420 },
  { name: 'Butter Chicken', desc: 'Ayam dalam saus tomat butter kari khas India.', emoji: '🍛', cal: 480 },
  { name: 'Seafood Paella', desc: 'Nasi Spanyol dengan udang, kerang, dan saffron.', emoji: '🥘', cal: 480 },
  { name: 'Prime Rib', desc: 'Daging sapi rib panggang dengan horseradish cream.', emoji: '🥩', cal: 680 },
  { name: 'Chicken Marsala', desc: 'Ayam goreng dengan saus anggur Marsala dan jamur.', emoji: '🍗', cal: 440 },
  { name: 'Ratatouille', desc: 'Sayuran panggang khas Prancis dengan herbs de Provence.', emoji: '🥘', cal: 280 },
  { name: 'Lobster Thermidor', desc: 'Lobster dengan saus krim dan keju, dipanggang.', emoji: '🦞', cal: 480 },
  { name: 'Veal Saltimbocca', desc: 'Daging anak sapi dengan prosciutto dan sage.', emoji: '🥩', cal: 460 },
  { name: 'Southern Fried Chicken', desc: 'Ayam goreng tepung buttermilk khas Amerika Selatan.', emoji: '🍗', cal: 580 },
  { name: 'Grilled Mahi Mahi', desc: 'Mahi-mahi panggang dengan salsa mango.', emoji: '🐟', cal: 360 },
  { name: 'Short Ribs Braised', desc: 'Tulang rusuk sapi braise dalam saus merah.', emoji: '🍖', cal: 580 },
  { name: 'Pad Thai', desc: 'Mie Thailand dengan udang, kacang, dan tauge.', emoji: '🍜', cal: 420 },
  { name: 'Lobster Mac and Cheese', desc: 'Mac and cheese premium dengan potongan lobster.', emoji: '🧀', cal: 580 },
  { name: 'Duck Confit', desc: 'Bebek confit dengan kentang dan salad.', emoji: '🍖', cal: 520 },
  { name: 'Grilled Portobello Steak', desc: 'Jamur portobello panggang ala steak dengan balsamic.', emoji: '🍄', cal: 220 },
  { name: 'Chicken Piccata', desc: 'Ayam goreng dengan saus lemon caper dan butter.', emoji: '🍗', cal: 400 },
  { name: 'Shrimp Gumbo', desc: 'Gumbo Louisiana dengan udang, okra, dan sosis.', emoji: '🍲', cal: 380 },
  { name: 'Lamb Shank Braised', desc: 'Sandung lamur braise lambat dengan sayuran.', emoji: '🍖', cal: 540 },
  { name: 'Sausage & Peppers', desc: 'Sosis goreng dengan paprika dan bawang dalam roti.', emoji: '🌭', cal: 440 },
  { name: 'Baked Cod', desc: 'Ikan kod panggang dengan breadcrumb dan herbs.', emoji: '🐟', cal: 320 },
  { name: 'Chicken Kiev', desc: 'Ayam goreng berisi mentega garlic.', emoji: '🍗', cal: 520 },
  { name: 'Veal Parmigiana', desc: 'Daging anak sapi dengan saus tomat dan keju.', emoji: '🥩', cal: 480 },
  { name: 'Crab Cakes', desc: 'Kue kepiting goreng dengan remoulade sauce.', emoji: '🦀', cal: 380 },
  { name: 'Pork Belly Roast', desc: 'Perut babi panggang renyah dengan apple slaw.', emoji: '🥓', cal: 560 },
  { name: 'Tuscan Chicken', desc: 'Ayam panggang dengan tomat sun-dried dan spinach.', emoji: '🍗', cal: 420 },
  { name: 'Beef Rendang', desc: 'Daging sapi empuk dalam bumbu rempah kaya.', emoji: '🥘', cal: 480 },
  { name: 'New England Clam Bake', desc: 'Steamer clam, lobster, kentang, dan corn on the cob.', emoji: '🦞', cal: 580 },
  { name: 'Herb Roast Chicken', desc: 'Ayam panggang utuh dengan rosemary dan thyme.', emoji: '🍗', cal: 420 },
  { name: 'Braised Oxtail', desc: 'Ekor sapi braise dalam saus merah pekat.', emoji: '🥘', cal: 520 },
  { name: 'Stuffed Pork Loin', desc: 'Daging babi isi apel dan kacang chestnut.', emoji: '🍖', cal: 460 },
  { name: 'Dijon Salmon', desc: 'Salmon dengan glaze Dijon mustard dan maple.', emoji: '🐟', cal: 380 },
  { name: 'Grilled Veal Chops', desc: 'Cincin anak sapi panggang dengan sage butter.', emoji: '🥩', cal: 440 },
  { name: 'Thai Green Curry', desc: 'Kari hijau Thailand dengan ayam dan kelapa.', emoji: '🍛', cal: 420 },
  { name: 'Cioppino', desc: 'Sup seafood Italia dengan udang, kerang, dan ikan.', emoji: '🍲', cal: 380 },
  { name: 'Pan-Seared Halibut', desc: 'Halibut panggang dengan saus brown butter dan almond.', emoji: '🐟', cal: 360 },
  { name: 'Chicken Enchiladas', desc: 'Tortilla isi ayam dengan saus enchilada dan keju.', emoji: '🌮', cal: 480 },
  { name: 'Lamb Kofta', desc: 'Sate daging domba dengan yogurt sauce dan nasi.', emoji: '🍢', cal: 440 },
  { name: 'Baked Ham', desc: 'Ham panggang utuh dengan glaze maple dan pineapple.', emoji: '🍖', cal: 420 },
  { name: 'Lemon Herb Chicken', desc: 'Ayam panggang dengan marinasi lemon dan herbs.', emoji: '🍗', cal: 380 },
  { name: 'Lobster Bisque', desc: 'Sup krim lobster mewah dengan daging lobster.', emoji: '🦞', cal: 360 },
  { name: 'Beef Carpaccio', desc: 'Daging sapi mentah tipis dengan arugula dan parmesan.', emoji: '🥩', cal: 280 },
  { name: 'Pizza Quattro Formaggi', desc: 'Pizza empat keju: mozzarella, gorgonzola, parmesan, fontina.', emoji: '🍕', cal: 520 },
  { name: 'Swedish Meatballs', desc: 'Bola daging Sweden dengan saus krim dan lingonberry.', emoji: '🍖', cal: 440 },
  { name: 'Grilled Octopus', desc: 'Gurita panggang dengan olive oil dan lemon.', emoji: '🐙', cal: 280 },
  { name: 'Mushroom Ravioli', desc: 'Ravioli isi jamur dengan saus krim sage.', emoji: '🍝', cal: 460 },
  { name: 'Honey Garlic Pork', desc: 'Daging babi panggang dengan glaze madu dan bawang putih.', emoji: '🍖', cal: 420 },
  { name: 'Blackened Redfish', desc: 'Ikan merah dibumbui Cajun panggang renyah.', emoji: '🐟', cal: 340 },
  { name: 'Garlic Butter Shrimp', desc: 'Udang goreng dengan garlic butter dan parsley.', emoji: '🦐', cal: 280 },
  { name: 'Vegetable Curry', desc: 'Kari sayuran India dengan kacang chickpea dan coconut milk.', emoji: '🍛', cal: 340 },
  { name: 'Braised Short Ribs', desc: 'Tulang rusuk pendek braise dalam saus merah anggur.', emoji: '🍖', cal: 580 },
  { name: 'Surf and Turf', desc: 'Kombinasi steak dan lobster tail dengan butter.', emoji: '🥩', cal: 720 },
  { name: 'Stuffed Shells', desc: 'Pasta shell besar isi ricotta dan spinach.', emoji: '🍝', cal: 460 },
  { name: 'Mongolian Beef', desc: 'Daging sapi dengan saus manis pedas dan bawang bombay.', emoji: '🥘', cal: 480 },
  { name: 'Crab Legs Butter', desc: 'Kaki kepiting rebus dengan butter lemon garlic.', emoji: '🦀', cal: 380 },
  { name: 'Rack of Pork', desc: 'Rack of pork panggang dengan apple cider glaze.', emoji: '🍖', cal: 520 },
  { name: 'Seafood Linguine', desc: 'Linguine dengan aneka seafood dan saus tomat.', emoji: '🍝', cal: 480 },
  { name: 'BBQ Baby Back Ribs', desc: 'Tulang rusuk babi kecil BBQ dengan cole slaw.', emoji: '🍖', cal: 620 },
  { name: 'Thai Basil Chicken', desc: 'Ayam tumis dengan basil Thailand dan cabai.', emoji: '🍛', cal: 360 },
  { name: 'Steak Diane', desc: 'Steak dengan saus brandy cream dan mushroom.', emoji: '🥩', cal: 520 },
  { name: 'Shrimp Alfredo', desc: 'Udang dengan pasta fettuccine dan saus Alfredo.', emoji: '🍝', cal: 540 },
  { name: 'Roasted Duck', desc: 'Bebek utuh panggang dengan glaze orange.', emoji: '🐦', cal: 480 },
  { name: 'Chicken Shawarma', desc: 'Ayam marinasi Timur Tengah dengan pita dan hummus.', emoji: '🌯', cal: 420 },
  { name: 'Grilled Swordfish Steaks', desc: 'Steak pedang panggang dengan Mediterranean salsa.', emoji: '🐟', cal: 380 },
  { name: 'Baked Stuffed Shrimp', desc: 'Udang isi crabmeat dan breadcrumb panggang.', emoji: '🦐', cal: 320 },
  { name: 'Beef Ragu Pappardelle', desc: 'Pasta pappardelle lebar dengan saus daging sapi rich.', emoji: '🍝', cal: 520 },
];

const snackRecipes = [
  { name: 'Mozzarella Sticks', desc: 'Tongkat keju mozzarella goreng tepung renyah.', emoji: '🧀', cal: 280 },
  { name: 'Chicken Wings BBQ', desc: 'Sayap ayam panggang dengan saus BBQ smoky.', emoji: '🍗', cal: 380 },
  { name: 'Nachos with Guacamole', desc: 'Tortilla chips dengan guacamole, salsa, dan keju.', emoji: '🧀', cal: 420 },
  { name: 'Fried Calamari', desc: 'Cumi goreng tepung dengan saus marinara.', emoji: '🦑', cal: 320 },
  { name: 'Onion Rings', desc: 'Cincin bawang goreng tepung crispy.', emoji: '🧅', cal: 340 },
  { name: 'Garlic Bread', desc: 'Roti garlic dengan mentega dan keju panggang.', emoji: '🍞', cal: 260 },
  { name: 'Bruschetta', desc: 'Roti Prancis panggang dengan tomat, bawang, dan basil.', emoji: '🍞', cal: 200 },
  { name: 'Slider Burgers', desc: 'Mini burger dengan daging sapi dan keju.', emoji: '🍔', cal: 340 },
  { name: 'Spinach Artichoke Dip', desc: 'Dip bayam dan artichoke creamy dengan tortilla chips.', emoji: '🥗', cal: 320 },
  { name: 'French Fries', desc: 'Kentang goreng renyah dengan garam dan saus.', emoji: '🍟', cal: 340 },
  { name: 'Jalapeno Poppers', desc: 'Jalapeno isi keju krim dibalut bacon dan digoreng.', emoji: '🌶️', cal: 280 },
  { name: 'Chicken Tenders', desc: 'Ayam goreng crispy dengan honey mustard sauce.', emoji: '🍗', cal: 380 },
  { name: 'Cheese Platter', desc: 'Piring keju dengan crackers, buah, dan madu.', emoji: '🧀', cal: 360 },
  { name: 'Popcorn Caramel', desc: 'Popcorn dengan karamel gula mentega.', emoji: '🍿', cal: 280 },
  { name: 'Hummus with Pita', desc: 'Hummus creamy dengan roti pita hangat.', emoji: '🫓', cal: 280 },
  { name: 'Deviled Eggs', desc: 'Telur rebus isi mayonnaise dan mustard.', emoji: '🥚', cal: 160 },
  { name: 'Pretzel Bites', desc: 'Pretzel mini garam dengan cheese dip.', emoji: '🥨', cal: 300 },
  { name: 'Spring Rolls', desc: 'Lumpia goreng isi sayuran dengan saus manis.', emoji: '🥟', cal: 220 },
  { name: 'Caprese Skewers', desc: 'Skewer mozzarella, tomat, dan basil dengan balsamic.', emoji: '🧀', cal: 180 },
  { name: 'Pigs in a Blanket', desc: 'Sosis mini dibungkus puff pastry panggang.', emoji: '🌭', cal: 280 },
  { name: 'Quesadillas', desc: 'Tortilla goreng berisi keju dan ayam.', emoji: '🧀', cal: 360 },
  { name: 'Potato Skins', desc: 'Kulit kentang panggang dengan bacon dan keju.', emoji: '🥔', cal: 320 },
  { name: 'Stuffed Mushrooms', desc: 'Jamur isi keju krim dan breadcrumbs.', emoji: '🍄', cal: 220 },
  { name: 'Tzatziki with Pita', desc: 'Saus yoghurt mentimun dengan roti pita.', emoji: '🫓', cal: 240 },
  { name: 'Fried Pickles', desc: 'Mentimun acak goreng tepung crispy.', emoji: '🥒', cal: 260 },
  { name: 'Loaded Nachos', desc: 'Tortilla chips dengan keju, jalapeno, dan sour cream.', emoji: '🧀', cal: 460 },
  { name: 'Shrimp Cocktail', desc: 'Udang rebus dengan cocktail sauce.', emoji: '🦐', cal: 180 },
  { name: 'Edamame', desc: 'Edamame kukus dengan garam laut dan chili flakes.', emoji: '🫛', cal: 160 },
  { name: 'Cheese Fondue', desc: 'Keju leleh dengan roti dan sayuran untuk dicelup.', emoji: '🧀', cal: 380 },
  { name: 'Buffalo Wings', desc: 'Sayap ayam dengan saus buffalo pedas.', emoji: '🍗', cal: 400 },
  { name: 'Pita Chips & Dip', desc: 'Chips pita dengan hummus dan tzatziki.', emoji: '🫓', cal: 260 },
  { name: 'Mini Pizzas', desc: 'Pizza mini topping berbagai dengan mozzarella.', emoji: '🍕', cal: 300 },
  { name: 'Bacon-Wrapped Dates', desc: 'Kurma dibungkus bacon dan dipanggang.', emoji: '🥓', cal: 200 },
  { name: 'Egg Rolls', desc: 'Lumpia goreng isi daging dan sayuran.', emoji: '🥟', cal: 240 },
  { name: 'Trail Mix', desc: 'Campuran kacang, kismis, dan coklat.', emoji: '🥜', cal: 280 },
  { name: 'Celery with Peanut Butter', desc: 'Seledri dengan selai kacang dan kismis.', emoji: '🥜', cal: 180 },
  { name: 'Guacamole & Chips', desc: 'Guacamole alpukat segar dengan tortilla chips.', emoji: '🥑', cal: 300 },
  { name: 'Antipasto Platter', desc: 'Piring cold cuts, keju, olive, dan sayuran.', emoji: '🧀', cal: 380 },
  { name: 'Crab Rangoon', desc: 'Wonton goreng isi keju dan kepiting.', emoji: '🥟', cal: 240 },
  { name: 'Sweet Potato Fries', desc: 'Ubi jalar goreng renyah dengan aioli sauce.', emoji: '🍟', cal: 280 },
  { name: 'Garlic Parmesan Wings', desc: 'Sayap ayam dengan garlic parmesan crust.', emoji: '🍗', cal: 380 },
  { name: 'Cucumber Bites', desc: 'Potongan mentimun dengan krim keju dan dill.', emoji: '🥒', cal: 120 },
  { name: 'Samosas', desc: 'Pastri goreng India isi kentang dan rempah.', emoji: '🥟', cal: 260 },
  { name: 'Brie en Croûte', desc: 'Keju Brie dibungkus puff pastry dan dipanggang.', emoji: '🧀', cal: 360 },
  { name: 'Popcorn Shrimp', desc: 'Udang kecil goreng tepung renyah.', emoji: '🦐', cal: 300 },
  { name: 'Tater Tots', desc: 'Kentang goreng bentuk silinder crispy.', emoji: '🥔', cal: 300 },
  { name: 'Chicken Satay', desc: 'Sate ayam dengan saus kacang khas Thailand.', emoji: '🍢', cal: 280 },
  { name: 'Focaccia Bread', desc: 'Roti Italia dengan olive oil, rosemary, dan garam laut.', emoji: '🍞', cal: 280 },
  { name: 'Mac and Cheese Bites', desc: 'Mac and cheese dalam bentuk gorengan kecil.', emoji: '🧀', cal: 340 },
  { name: 'Meatballs Swedish', desc: 'Bola daging Swedia mini dengan saus krim.', emoji: '🍖', cal: 280 },
  { name: 'Nachos Supreme', desc: 'Nachos dengan semua topping: keju, salsa, guac, sour cream.', emoji: '🧀', cal: 480 },
  { name: 'Vegetable Spring Rolls', desc: 'Lumpia segar isi sayuran dengan saus kacang.', emoji: '🥟', cal: 160 },
];

const dessertRecipes = [
  { name: 'Chocolate Lava Cake', desc: 'Kue coklat dengan lelehan coklat di dalam.', emoji: '🍰', cal: 380 },
  { name: 'Tiramisu', desc: 'Dessert Italia dengan mascarpone dan kopi.', emoji: '🍰', cal: 380 },
  { name: 'Apple Pie', desc: 'Pie apal klasik Amerika dengan cinnamon dan vanilla ice cream.', emoji: '🥧', cal: 360 },
  { name: 'Cheesecake NY', desc: 'Cheesecake klasik New York dengan crust graham cracker.', emoji: '🍰', cal: 420 },
  { name: 'Crème Brûlée', desc: 'Pudding custard Prancis dengan gula karamel di atas.', emoji: '🍮', cal: 320 },
  { name: 'Brownies Fudge', desc: 'Brownies coklat tebal yang fudgy dan lembap.', emoji: '🍫', cal: 360 },
  { name: 'Panna Cotta', desc: 'Pudding krim Italia dengan saus berry.', emoji: '🍮', cal: 280 },
  { name: 'Key Lime Pie', desc: 'Pie lime asam dengan whipped cream.', emoji: '🥧', cal: 320 },
  { name: 'Chocolate Mousse', desc: 'Mousse coklat lembut dan ringan dengan whipped cream.', emoji: '🍫', cal: 340 },
  { name: 'Crêpes Suzette', desc: 'Crepe Prancis dengan saus jeruk dan Grand Marnier.', emoji: '🥞', cal: 340 },
  { name: 'Banana Split', desc: 'Pisang potong dengan es krim, saus coklat, dan whipped cream.', emoji: '🍌', cal: 480 },
  { name: 'Sticky Toffee Pudding', desc: 'Pudding kue kurma dengan saus toffee hangat.', emoji: '🍰', cal: 420 },
  { name: 'Profiteroles', desc: 'Choux pastry kecil dengan ice cream dan saus coklat.', emoji: '🧁', cal: 360 },
  { name: 'Red Velvet Cake', desc: 'Kue coklat merah dengan frosting cream cheese.', emoji: '🍰', cal: 440 },
  { name: 'Apple Crumble', desc: 'Apal panggang dengan crumble butter dan vanilla ice cream.', emoji: '🥧', cal: 360 },
  { name: 'Soufflé Chocolate', desc: 'Souffle coklat Prancis yang mengembang ringan.', emoji: '🍫', cal: 320 },
  { name: 'New York Cheesecake', desc: 'Cheesecake kremi dengan strawberry topping.', emoji: '🍰', cal: 400 },
  { name: 'Blueberry Cobbler', desc: 'Blueberry panggang dengan topping biscuit.', emoji: '🫐', cal: 340 },
  { name: 'Éclair', desc: 'Choux pastry panjang dengan krim dan coklat topping.', emoji: '🍫', cal: 340 },
  { name: 'Tarte Tatin', desc: 'Pie apal terbalik Prancis dengan karamel.', emoji: '🥧', cal: 360 },
  { name: 'Trifle', desc: 'Dessert berlapis dengan custard, buah, dan sponge cake.', emoji: '🍮', cal: 380 },
  { name: 'Lemon Bars', desc: 'Bar lemon dengan crust shortbread dan glaze.', emoji: '🍋', cal: 280 },
  { name: 'Carrot Cake', desc: 'Kue wortel dengan cream cheese frosting dan walnut.', emoji: '🥕', cal: 400 },
  { name: 'Bread Pudding', desc: 'Pudding roti dengan custard, raisin, dan cinnamon.', emoji: '🍞', cal: 360 },
  { name: 'Macarons', desc: 'Kue meringue Prancis berbagai rasa warna-warni.', emoji: '🧁', cal: 240 },
  { name: 'S\'mores', desc: 'Graham cracker, marshmallow panggang, dan coklat.', emoji: '🍫', cal: 320 },
  { name: 'Molten Chocolate Cake', desc: 'Kue coklat panas dengan lelehan coklat di tengah.', emoji: '🍰', cal: 400 },
  { name: 'Pavlova', desc: 'Meringue renyah dengan krim dan buah segar.', emoji: '🍮', cal: 320 },
  { name: 'Cannoli', desc: 'Pastry kerucut Italia berisi krim ricotta manis.', emoji: '🧁', cal: 280 },
  { name: 'Gulab Jamun', desc: 'Bola donat India dalam sirup rose dan cardamom.', emoji: '🧁', cal: 320 },
  { name: 'Churros', desc: 'Donat goreng Spanyol dengan coklat dan gula kayu manis.', emoji: '🍫', cal: 340 },
  { name: 'Pumpkin Pie', desc: 'Pie labu dengan rempah dan whipped cream.', emoji: '🥧', cal: 320 },
  { name: 'Madeleines', desc: 'Kue kecil Prancis bentuk kerang dengan rasa butter.', emoji: '🧁', cal: 200 },
  { name: 'Baklava', desc: 'Kue filo berlapis dengan kacang pistachio dan madu.', emoji: '🍯', cal: 320 },
  { name: 'Crème Caramel', desc: 'Flan karamel Prancis dengan custard lembut.', emoji: '🍮', cal: 280 },
  { name: 'Strawberry Shortcake', desc: 'Sponge cake dengan strawberry segar dan whipped cream.', emoji: '🍓', cal: 340 },
  { name: 'Chocolate Chip Cookies', desc: 'Cookies coklat chip renyah di luar lembut di dalam.', emoji: '🍪', cal: 260 },
  { name: 'Rice Pudding', desc: 'Puding nasi dengan vanilla dan cinnamon.', emoji: '🍮', cal: 240 },
  { name: 'Affogato', desc: 'Es krim vanilla disiram espresso panas.', emoji: '🍦', cal: 220 },
  { name: 'Snickerdoodles', desc: 'Cookies kayu manis dengan gula coating.', emoji: '🍪', cal: 240 },
  { name: 'Mille-Feuille', desc: 'Pastry berlapis dengan krim custard dan gula icing.', emoji: '🧁', cal: 340 },
  { name: 'Donuts Glazed', desc: 'Donat classic dengan glaze manis.', emoji: '🍩', cal: 300 },
  { name: 'Lemon Meringue Pie', desc: 'Pie lemon dengan topping meringue panggang.', emoji: '🥧', cal: 320 },
  { name: 'Waffles with Ice Cream', desc: 'Waffle hangat dengan es krim vanilla dan syrup.', emoji: '🧇', cal: 420 },
  { name: 'Tres Leches Cake', desc: 'Kue spons rendaman tiga susu khas Amerika Latin.', emoji: '🍰', cal: 380 },
  { name: 'Biscoff Cheesecake', desc: 'Cheesecake dengan biskuit Lotus Biscoff.', emoji: '🍰', cal: 420 },
  { name: 'German Chocolate Cake', desc: 'Kue coklat dengan frosting kelapa dan pecan.', emoji: '🍫', cal: 460 },
  { name: 'Pecan Pie', desc: 'Pie pecan khas Amerika Selatan dengan karamel.', emoji: '🥧', cal: 440 },
  { name: 'Gelato', desc: 'Es krim Italia creamy berbagai rasa.', emoji: '🍦', cal: 220 },
  { name: 'Cupcakes Red Velvet', desc: 'Cupcake red velvet dengan frosting cream cheese.', emoji: '🧁', cal: 280 },
  { name: 'Peach Cobbler', desc: 'Peach panggang dengan topping biscuit renyah.', emoji: '🍑', cal: 340 },
  { name: 'Brownies Blondie', desc: 'Brownies vanilla coklat putih dengan pecan.', emoji: '🍫', cal: 340 },
  { name: 'Bombe Alaska', desc: 'Es krim dibungkus meringue dan dipanggang.', emoji: '🍦', cal: 380 },
];

const drinkRecipes = [
  { name: 'Classic Lemonade', desc: 'Lemonade segar dengan lemon segar dan madu.', emoji: '🍋', cal: 120 },
  { name: 'Iced Latte', desc: 'Es kopi latte dengan susu segar dan espresso.', emoji: '☕', cal: 120 },
  { name: 'Hot Chocolate', desc: 'Coklat panas dengan whipped cream dan marshmallow.', emoji: '☕', cal: 260 },
  { name: 'Mango Smoothie', desc: 'Smoothie mangga segar dengan yogurt dan madu.', emoji: '🥭', cal: 180 },
  { name: 'Mojito Mocktail', desc: 'Mojito tanpa alkohol dengan mint dan lime.', emoji: '🍹', cal: 80 },
  { name: 'Iced Tea Peach', desc: 'Es teh dengan sirup peach dan lemon.', emoji: '🍵', cal: 100 },
  { name: 'Berry Smoothie', desc: 'Smoothie campuran berry dengan chia seed.', emoji: '🫐', cal: 160 },
  { name: 'Orange Julius', desc: 'Minuman orange krimi ala mall.', emoji: '🍊', cal: 200 },
  { name: 'Vanilla Milkshake', desc: 'Milkshake vanilla dengan es krim dan whipped cream.', emoji: '🥤', cal: 320 },
  { name: 'Green Smoothie', desc: 'Smoothie hijau bayam, pisang, dan apel.', emoji: '🥬', cal: 160 },
  { name: 'Strawberry Lemonade', desc: 'Lemonade dengan strawberry segar.', emoji: '🍓', cal: 140 },
  { name: 'Chai Latte', desc: 'Teh chai India dengan susu foam dan kayu manis.', emoji: '☕', cal: 180 },
  { name: 'Mint Tea', desc: 'Teh mint segar hangat dengan madu.', emoji: '🍵', cal: 60 },
  { name: 'Watermelon Juice', desc: 'Jus semangka segar dengan es batu.', emoji: '🍉', cal: 100 },
  { name: 'Pina Colada Mocktail', desc: 'Minuman nanas dan kelapa tanpa alkohol.', emoji: '🍍', cal: 180 },
  { name: 'Cappuccino', desc: 'Kopi espresso dengan susu foam tebal.', emoji: '☕', cal: 100 },
  { name: 'Chocolate Milk', desc: 'Susu coklat dingin yang creamy dan manis.', emoji: '🥛', cal: 200 },
  { name: 'Ginger Lemon Tea', desc: 'Teh jahe lemon hangat yang menyegarkan.', emoji: '🍵', cal: 60 },
  { name: 'Berry Blast Smoothie', desc: 'Smoothie berry mix dengan yogurt Greek.', emoji: '🫐', cal: 180 },
  { name: 'Arnold Palmer', desc: 'Campuran es teh dan lemonade.', emoji: '🍵', cal: 100 },
];

// Helper functions
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getDifficulty() {
  const r = Math.random();
  if (r < 0.4) return 'Mudah';
  if (r < 0.8) return 'Sedang';
  return 'Susah';
}

function getIngredientCategory(name) {
  const lower = name.toLowerCase();
  if (/chicken|ayam|beef|daging|pork|babi|lamb|domba|bacon|turkey|kalkun|veal|shrimp|udang|salmon|ikan|fish|tuna|crab|kepiting|lobster|meat|sausage|sosis|ham|duck|bebek/.test(lower)) return 'Protein';
  if (/flour|tepung|sugar|gula|salt|garam|pepper|merica|butter|mentega|oil|minyak|egg|telur|milk|susu|cream|cheese|keju|yogurt|vinegar|cuka|sauce|saus|mustard|spice|rempah|garlic|bawang putih|onion|bawang|herb|thyme|rosemary|basil|oregano|parsley|cumin|paprika|cinnamon|nutmeg|vanilla|honey|madu|yeast|ragi|baking|soda|baking powder/.test(lower)) return 'Bumbu';
  if (/tomato|sayur|bayam|spinach|broccoli|carrot|wortel|potato|kentang|onion|bawang|pepper|paprika|mushroom|jamur|zucchini|cucumber|celery|corn|jagung|pea|kacang|bean|lettuce|cabbage|kubis|garlic|ginger|jahe|lemon|lime|avocado|alpukat|apple|apel|orange|banana|peach|mango|berry|strawberry|blueberry|olive/.test(lower)) return 'Sayuran';
  return 'Bahan Utama';
}

function generateIngredients(recipeName, emoji, calories) {
  const templates = {
    pizza: [
      { name: 'Pizza dough', amount: 250, unit: 'gram' },
      { name: 'Tomato sauce', amount: 100, unit: 'ml' },
      { name: 'Mozzarella cheese', amount: 150, unit: 'gram' },
      { name: 'Olive oil', amount: 2, unit: 'sendok makan' },
      { name: 'Fresh basil', amount: 5, unit: 'lembar' },
      { name: 'Salt', amount: 0.5, unit: 'sendok teh' },
      { name: 'Oregano', amount: 0.5, unit: 'sendok teh' },
    ],
    pasta: [
      { name: 'Pasta', amount: 200, unit: 'gram' },
      { name: 'Olive oil', amount: 3, unit: 'sendok makan' },
      { name: 'Garlic', amount: 3, unit: 'siung' },
      { name: 'Parmesan cheese', amount: 50, unit: 'gram' },
      { name: 'Heavy cream', amount: 100, unit: 'ml' },
      { name: 'Salt and pepper', amount: 1, unit: 'sendok teh' },
      { name: 'Fresh parsley', amount: 2, unit: 'sendok makan' },
    ],
    steak: [
      { name: 'Beef steak', amount: 250, unit: 'gram' },
      { name: 'Butter', amount: 30, unit: 'gram' },
      { name: 'Garlic', amount: 3, unit: 'siung' },
      { name: 'Fresh thyme', amount: 3, unit: 'batang' },
      { name: 'Rosemary', amount: 2, unit: 'batang' },
      { name: 'Salt', amount: 1, unit: 'sendok teh' },
      { name: 'Black pepper', amount: 0.5, unit: 'sendok teh' },
      { name: 'Olive oil', amount: 2, unit: 'sendok makan' },
    ],
    salad: [
      { name: 'Romaine lettuce', amount: 150, unit: 'gram' },
      { name: 'Cherry tomato', amount: 100, unit: 'gram' },
      { name: 'Cucumber', amount: 1, unit: 'buah' },
      { name: 'Olive oil', amount: 3, unit: 'sendok makan' },
      { name: 'Lemon juice', amount: 2, unit: 'sendok makan' },
      { name: 'Salt and pepper', amount: 1, unit: 'sendok teh' },
      { name: 'Parmesan cheese', amount: 30, unit: 'gram' },
    ],
    soup: [
      { name: 'Chicken broth', amount: 500, unit: 'ml' },
      { name: 'Onion', amount: 1, unit: 'buah' },
      { name: 'Carrot', amount: 2, unit: 'buah' },
      { name: 'Celery', amount: 2, unit: 'batang' },
      { name: 'Garlic', amount: 3, unit: 'siung' },
      { name: 'Olive oil', amount: 2, unit: 'sendok makan' },
      { name: 'Salt and pepper', amount: 1, unit: 'sendok teh' },
      { name: 'Fresh herbs', amount: 1, unit: 'sendok makan' },
    ],
    burger: [
      { name: 'Ground beef', amount: 200, unit: 'gram' },
      { name: 'Burger buns', amount: 2, unit: 'buah' },
      { name: 'Lettuce', amount: 2, unit: 'lembar' },
      { name: 'Tomato', amount: 2, unit: 'iris' },
      { name: 'Onion', amount: 1, unit: 'buah' },
      { name: 'Cheese slice', amount: 2, unit: 'lembar' },
      { name: 'Pickles', amount: 4, unit: 'buah' },
      { name: 'Ketchup', amount: 1, unit: 'sendok makan' },
      { name: 'Mustard', amount: 1, unit: 'sendok makan' },
    ],
    sandwich: [
      { name: 'Bread slices', amount: 4, unit: 'lembar' },
      { name: 'Butter', amount: 15, unit: 'gram' },
      { name: 'Lettuce', amount: 2, unit: 'lembar' },
      { name: 'Tomato', amount: 2, unit: 'iris' },
      { name: 'Cheese', amount: 50, unit: 'gram' },
      { name: 'Mustard', amount: 1, unit: 'sendok teh' },
      { name: 'Salt and pepper', amount: 0.5, unit: 'sendok teh' },
    ],
    chicken: [
      { name: 'Chicken breast', amount: 300, unit: 'gram' },
      { name: 'Olive oil', amount: 2, unit: 'sendok makan' },
      { name: 'Garlic', amount: 3, unit: 'siung' },
      { name: 'Lemon juice', amount: 2, unit: 'sendok makan' },
      { name: 'Salt and pepper', amount: 1, unit: 'sendok teh' },
      { name: 'Paprika', amount: 0.5, unit: 'sendok teh' },
      { name: 'Fresh herbs', amount: 1, unit: 'sendok makan' },
    ],
    cake: [
      { name: 'All-purpose flour', amount: 200, unit: 'gram' },
      { name: 'Sugar', amount: 150, unit: 'gram' },
      { name: 'Butter', amount: 100, unit: 'gram' },
      { name: 'Eggs', amount: 3, unit: 'butir' },
      { name: 'Vanilla extract', amount: 1, unit: 'sendok teh' },
      { name: 'Baking powder', amount: 1, unit: 'sendok teh' },
      { name: 'Salt', amount: 0.25, unit: 'sendok teh' },
      { name: 'Milk', amount: 100, unit: 'ml' },
    ],
    dessert: [
      { name: 'Heavy cream', amount: 200, unit: 'ml' },
      { name: 'Sugar', amount: 80, unit: 'gram' },
      { name: 'Vanilla extract', amount: 1, unit: 'sendok teh' },
      { name: 'Egg yolks', amount: 3, unit: 'butir' },
      { name: 'Milk', amount: 200, unit: 'ml' },
      { name: 'Butter', amount: 30, unit: 'gram' },
      { name: 'Chocolate', amount: 100, unit: 'gram' },
    ],
    snack: [
      { name: 'All-purpose flour', amount: 150, unit: 'gram' },
      { name: 'Eggs', amount: 2, unit: 'butir' },
      { name: 'Breadcrumbs', amount: 100, unit: 'gram' },
      { name: 'Oil for frying', amount: 300, unit: 'ml' },
      { name: 'Salt and pepper', amount: 1, unit: 'sendok teh' },
      { name: 'Garlic powder', amount: 0.5, unit: 'sendok teh' },
    ],
    drink: [
      { name: 'Water', amount: 300, unit: 'ml' },
      { name: 'Sugar', amount: 2, unit: 'sendok makan' },
      { name: 'Lemon juice', amount: 2, unit: 'sendok makan' },
      { name: 'Ice cubes', amount: 4, unit: 'buah' },
      { name: 'Fresh mint', amount: 3, unit: 'lembar' },
    ],
    breakfast: [
      { name: 'Eggs', amount: 3, unit: 'butir' },
      { name: 'Milk', amount: 100, unit: 'ml' },
      { name: 'Butter', amount: 20, unit: 'gram' },
      { name: 'Flour', amount: 150, unit: 'gram' },
      { name: 'Sugar', amount: 2, unit: 'sendok makan' },
      { name: 'Salt', amount: 0.5, unit: 'sendok teh' },
      { name: 'Baking powder', amount: 1, unit: 'sendok teh' },
      { name: 'Maple syrup', amount: 3, unit: 'sendok makan' },
    ],
    wrap: [
      { name: 'Flour tortilla', amount: 2, unit: 'lembar' },
      { name: 'Grilled chicken', amount: 150, unit: 'gram' },
      { name: 'Lettuce', amount: 2, unit: 'lembar' },
      { name: 'Tomato', amount: 1, unit: 'buah' },
      { name: 'Cheese', amount: 40, unit: 'gram' },
      { name: 'Sour cream', amount: 2, unit: 'sendok makan' },
      { name: 'Salsa', amount: 2, unit: 'sendok makan' },
    ],
    taco: [
      { name: 'Tortilla shells', amount: 4, unit: 'buah' },
      { name: 'Ground meat', amount: 200, unit: 'gram' },
      { name: 'Onion', amount: 1, unit: 'buah' },
      { name: 'Lettuce', amount: 1, unit: 'cangkir' },
      { name: 'Tomato', amount: 1, unit: 'buah' },
      { name: 'Cheese', amount: 50, unit: 'gram' },
      { name: 'Sour cream', amount: 2, unit: 'sendok makan' },
      { name: 'Salsa', amount: 3, unit: 'sendok makan' },
    ],
    rice: [
      { name: 'Rice', amount: 200, unit: 'gram' },
      { name: 'Butter', amount: 20, unit: 'gram' },
      { name: 'Onion', amount: 1, unit: 'buah' },
      { name: 'Garlic', amount: 2, unit: 'siung' },
      { name: 'Broth', amount: 400, unit: 'ml' },
      { name: 'Parmesan cheese', amount: 40, unit: 'gram' },
      { name: 'White wine', amount: 50, unit: 'ml' },
    ],
    fish: [
      { name: 'Fish fillet', amount: 250, unit: 'gram' },
      { name: 'Olive oil', amount: 2, unit: 'sendok makan' },
      { name: 'Lemon', amount: 1, unit: 'buah' },
      { name: 'Garlic', amount: 2, unit: 'siung' },
      { name: 'Butter', amount: 20, unit: 'gram' },
      { name: 'Fresh herbs', amount: 1, unit: 'sendok makan' },
      { name: 'Salt and pepper', amount: 1, unit: 'sendok teh' },
      { name: 'Capers', amount: 1, unit: 'sendok makan' },
    ],
    default: [
      { name: 'Main ingredient', amount: 250, unit: 'gram' },
      { name: 'Olive oil', amount: 2, unit: 'sendok makan' },
      { name: 'Garlic', amount: 2, unit: 'siung' },
      { name: 'Onion', amount: 1, unit: 'buah' },
      { name: 'Salt and pepper', amount: 1, unit: 'sendok teh' },
      { name: 'Fresh herbs', amount: 1, unit: 'sendok makan' },
    ],
  };

  // Determine template based on recipe name
  const lower = recipeName.toLowerCase();
  let template;
  if (/pizza|flatbread/.test(lower)) template = templates.pizza;
  else if (/pasta|spaghetti|lasagna|mac and cheese|fettuccine|linguine|ziti|penne|ravioli/.test(lower)) template = templates.pasta;
  else if (/steak|wellington|filet|ribeye|t-bone|prime rib/.test(lower)) template = templates.steak;
  else if (/salad|coleslaw|tabouleh/.test(lower)) template = templates.salad;
  else if (/soup|stew|chowder|bisque|gumbo|chili|bouillabaisse/.test(lower)) template = templates.soup;
  else if (/burger|slider/.test(lower)) template = templates.burger;
  else if (/sandwich|sub|reuben|blt|grilled cheese|wrap|panini|po\' boy/.test(lower)) template = templates.sandwich;
  else if (/chicken|wings|tender|nugget|fajita|shawarma/.test(lower)) template = templates.chicken;
  else if (/cake|cheesecake|brownie|cupcake|tiramisu|muffin|scone/.test(lower)) template = templates.cake;
  else if (/pudding|brulee|mousse|souffle|panna cotta|crumble|pie|tart|cookie|donut|gelato|ice cream|dessert/.test(lower)) template = templates.dessert;
  else if (/stick|ring|bite|fries|popcorn|wings|nugget|spring roll|egg roll|nachos|chips|bread|bruschetta/.test(lower)) template = templates.snack;
  else if (/lemonade|smoothie|tea|coffee|latte|milkshake|juice|mocktail|hot chocolate/.test(lower)) template = templates.drink;
  else if (/pancake|waffle|french toast|omelette|scrambled|muffin|scone|crepe|cereal|granola|yogurt|overnight|chia/.test(lower)) template = templates.breakfast;
  else if (/wrap|burrito|quesadilla|falafel/.test(lower)) template = templates.wrap;
  else if (/taco/.test(lower)) template = templates.taco;
  else if (/risotto|fried rice|pilaf|jambalaya|paella/.test(lower)) template = templates.rice;
  else if (/fish|salmon|shrimp|seafood|cod|mahi|halibut|swordfish|trout|tuna|sea bass|octopus|crab|lobster|clam/.test(lower)) template = templates.fish;
  else if (/lamb|chops|kofta|shank|meatball|pork|beef|roast|rib|stroganoff|duck|veal|turkey/.test(lower)) template = templates.steak;
  else template = templates.default;

  return template.map(i => ({ ...i, category: getIngredientCategory(i.name) }));
}

function generateSteps(recipeName, emoji) {
  const lower = recipeName.toLowerCase();
  
  const cookingSteps = {
    pizza: [
      'Panaskan oven hingga 220°C.',
      'Giling adonan pizza di permukaan yang ditaburi tepung.',
      'Oleskan saus tomat merata di atas adonan.',
      'Taburkan keju mozzarella dan topping lainnya.',
      'Panggang selama 12-15 menit hingga keju meleleh dan kerak renyah.',
      'Angkat, beri olive oil dan basil segar. Sajikan panas.',
    ],
    pasta: [
      'Didihkan air garam dalam panci besar, masak pasta al dente sesuai petunjuk.',
      'Sementara itu, panaskan olive oil di wajan dengan api sedang.',
      'Tumis bawang putih hingga harum, tambahkan bahan utama.',
      'Tuangkan heavy cream dan bumbu, masak hingga mengental.',
      'Masukkan pasta yang sudah ditiriskan ke dalam saus.',
      'Aduk rata, taburi parmesan dan herbs. Sajikan segera.',
    ],
    steak: [
      'Keluar daging dari kulkas 30 menit sebelum masak agar suhu ruang.',
      'Keringkan daging, lumuri garam dan merica.',
      'Panaskan pan besi cor dengan api besar, tambahkan olive oil.',
      'Masak steak 3-4 menit per sisi untuk medium rare.',
      'Masukkan butter, bawang putih, thyme, dan rosemary ke pan.',
      'Sendokkan butter cair ke atas steak berulang kali selama 1 menit.',
      'Istirahatkan steak selama 5 menit sebelum diiris. Sajikan.',
    ],
    salad: [
      'Cuci dan keringkan sayuran hijau.',
      'Potong sayuran sesuai ukuran yang diinginkan.',
      'Campurkan olive oil, lemon juice, garam, dan merica untuk dressing.',
      'Tata sayuran di piring saji.',
      'Tambahkan topping seperti keju, kacang, atau crouton.',
      'Siram dressing di atas salad sebelum disajikan.',
    ],
    soup: [
      'Panaskan olive oil di panci, tumis bawang dan bawang putih hingga harum.',
      'Masukkan sayuran, aduk selama 3-5 menit.',
      'Tuangkan broth, didihkan kemudian kecilkan api.',
      'Masak dengan api kecil selama 20-30 menit hingga sayuran empuk.',
      'Bumbui garam dan merica sesuai selera.',
      'Angkat, sajikan hangat dengan roti atau crouton.',
    ],
    burger: [
      'Campurkan daging giling dengan garam dan merica, bentuk menjadi patty.',
      'Panaskan grill atau pan dengan api tinggi.',
      'Masak patty 4-5 menit per sisi untuk medium.',
      'Panggang roti burger sebentar hingga agak renyah.',
      'Tata roti bawah, lettuce, patty, keju, tomat, bawang, dan roti atas.',
      'Sajikan dengan kentang goreng dan saus.',
    ],
    sandwich: [
      'Siapkan semua bahan dan iris sayuran.',
      'Olesi mentega atau mayo di kedua sisi roti.',
      'Tata isi sandwich secara berlapis.',
      'Tambahkan keju dan bumbu sesuai selera.',
      'Tekan sandwich perlahan dan potong diagonal.',
      'Sajikan dengan keripik atau salad.',
    ],
    chicken: [
      'Marinasi ayam dengan bumbu minimal 30 menit.',
      'Panaskan oven hingga 200°C atau grill.',
      'Masak ayam selama 20-25 menit hingga matang sempurna.',
      'Sementara itu, siapkan saus atau sampingan.',
      'Pastikan suhu internal ayam mencapai 74°C.',
      'Istirahatkan ayam 5 menit sebelum diiris. Sajikan.',
    ],
    cake: [
      'Panaskan oven hingga 180°C. Siapkan loyang dan olesi mentega.',
      'Campurkan bahan kering: tepung, gula, baking powder, dan garam.',
      'Kocok mentega dan telur hingga creamy, tambahkan vanilla.',
      'Masukkan bahan kering secara bertahap ke campuran basah, sambil diaduk.',
      'Tuang adonan ke loyang, ratakan permukaannya.',
      'Panggang selama 25-35 menit hingga tusuk gigi keluar bersih.',
      'Dinginkan sebelum dihias atau disajikan.',
    ],
    dessert: [
      'Siapkan semua bahan dan peralatan.',
      'Campurkan bahan utama sesuai resep.',
      'Masak dengan api kecil sambil diaduk terus.',
      'Tuang ke wadah saji.',
      'Dinginkan di kulkas minimal 2 jam.',
      'Hias sebelum disajikan.',
    ],
    snack: [
      'Siapkan bahan dan panaskan minyak.',
      'Campurkan bahan kering dalam mangkuk.',
      'Balut bahan utama dengan adonan tepung.',
      'Goreng dalam minyak panas hingga keemasan.',
      'Tiriskan di tisu dapur.',
      'Sajikan dengan saus pendamping.',
    ],
    drink: [
      'Siapkan semua bahan.',
      'Campurkan bahan cair dalam gelas atau blender.',
      'Aduk rata atau blend hingga halus.',
      'Masukkan es batu.',
      'Hias dengan garnish.',
      'Sajikan segera.',
    ],
    breakfast: [
      'Siapkan semua bahan di meja kerja.',
      'Campurkan bahan basah: telur, susu, dan mentega leleh.',
      'Campurkan bahan kering: tepung, gula, baking powder, dan garam.',
      'Gabungkan bahan basah dan kering, aduk hingga tercampur rata.',
      'Masak di pan atau oven sesuai jenis makanan.',
      'Sajikan dengan maple syrup atau topping lainnya.',
    ],
    wrap: [
      'Siapkan tortilla dan semua bahan isi.',
      'Panaskan tortilla sebentar di pan kering.',
      'Oleskan saus atau spread di tengah tortilla.',
      'Tata sayuran dan protein di atas saus.',
      'Lipat samping tortilla dan gulung rapat.',
      'Potong diagonal dan sajikan.',
    ],
    taco: [
      'Panaskan tortilla di pan kering atau oven.',
      'Masak daging cincang dengan bumbu hingga matang.',
      'Siapkan sayuran: iris tomat, parut keju, potong lettuce.',
      'Isi tortilla dengan daging dan topping.',
      'Tambahkan salsa dan sour cream.',
      'Sajikan dengan irisan lime.',
    ],
    rice: [
      'Cuci beras hingga bersih, tiriskan.',
      'Panaskan mentega di pan, tumis bawang dan bawang putih.',
      'Masukkan beras, aduk hingga berwarna sedikit bening.',
      'Tuangkan broth, didihkan kemudian kecilkan api.',
      'Masak dengan api kecil hingga nasi matang dan air terserap.',
      'Tambahkan parmesan dan bumbu. Aduk rata dan sajikan.',
    ],
    fish: [
      'Keringkan ikan dengan tisu dapur, lumuri garam dan merica.',
      'Panaskan olive oil di pan dengan api sedang-tinggi.',
      'Masak ikan skin side down selama 3-4 menit.',
      'Balik ikan, masak 2-3 menit lagi hingga matang.',
      'Tambahkan butter dan bawang putih di akhir proses.',
      'Sajikan dengan lemon wedge dan herbs segar.',
    ],
    default: [
      'Siapkan semua bahan dan peralatan.',
      'Panaskan minyak di wajan dengan api sedang.',
      'Tumis bawang putih dan bawang bombay hingga harum.',
      'Masukkan bahan utama, masak hingga berubah warna.',
      'Bumbui garam, merica, dan rempah sesuai selera.',
      'Masak hingga matang sempurna.',
      'Angkat dan sajikan.',
    ],
  };

  // Pick template
  let steps;
  if (/pizza|flatbread/.test(lower)) steps = cookingSteps.pizza;
  else if (/pasta|spaghetti|lasagna|mac and cheese|fettuccine|linguine|ziti|ravioli/.test(lower)) steps = cookingSteps.pasta;
  else if (/steak|wellington|filet|ribeye|t-bone|prime rib/.test(lower)) steps = cookingSteps.steak;
  else if (/salad/.test(lower)) steps = cookingSteps.salad;
  else if (/soup|stew|chowder|bisque|gumbo|chili|bouillabaisse/.test(lower)) steps = cookingSteps.soup;
  else if (/burger|slider/.test(lower)) steps = cookingSteps.burger;
  else if (/sandwich|sub|reuben|blt|panini/.test(lower)) steps = cookingSteps.sandwich;
  else if (/chicken|wings|tender|nugget/.test(lower)) steps = cookingSteps.chicken;
  else if (/cake|cheesecake|brownie|cupcake|muffin|scone/.test(lower)) steps = cookingSteps.cake;
  else if (/pudding|brulee|mousse|souffle|panna cotta|crumble|pie|tart|cookie|donut|gelato|ice cream/.test(lower)) steps = cookingSteps.dessert;
  else if (/stick|ring|bite|fries|popcorn|nachos|chips|bread|bruschetta|spring roll|egg roll/.test(lower)) steps = cookingSteps.snack;
  else if (/lemonade|smoothie|tea|coffee|latte|milkshake|juice|mocktail|hot chocolate/.test(lower)) steps = cookingSteps.drink;
  else if (/pancake|waffle|french toast|omelette|scrambled|crepe|granola|yogurt|overnight|chia/.test(lower)) steps = cookingSteps.breakfast;
  else if (/wrap|burrito|quesadilla|falafel/.test(lower)) steps = cookingSteps.wrap;
  else if (/taco/.test(lower)) steps = cookingSteps.taco;
  else if (/risotto|fried rice|pilaf|jambalaya|paella/.test(lower)) steps = cookingSteps.rice;
  else if (/fish|salmon|shrimp|seafood|cod|mahi|halibut|swordfish|trout|tuna|sea bass|octopus|crab|lobster|clam/.test(lower)) steps = cookingSteps.fish;
  else steps = cookingSteps.default;

  return steps;
}

function generateTags(recipeName) {
  const lower = recipeName.toLowerCase();
  const tags = [];
  if (/pizza/.test(lower)) tags.push('pizza', 'italian');
  if (/pasta|spaghetti|lasagna|fettuccine|linguine|ravioli/.test(lower)) tags.push('pasta', 'italian');
  if (/steak|beef/.test(lower)) tags.push('steak', 'daging');
  if (/chicken|ayam/.test(lower)) tags.push('chicken', 'ayam');
  if (/salad/.test(lower)) tags.push('salad', 'sehat');
  if (/soup|stew|chowder/.test(lower)) tags.push('soup', 'hangat');
  if (/burger/.test(lower)) tags.push('burger', 'cepat');
  if (/sandwich/.test(lower)) tags.push('sandwich', 'praktis');
  if (/grilled|panggang/.test(lower)) tags.push('grilled', 'sehat');
  if (/fried|goreng/.test(lower)) tags.push('goreng', 'crispy');
  if (/baked|panggang/.test(lower)) tags.push('baked');
  if (/chocolate|coklat/.test(lower)) tags.push('coklat', 'manis');
  if (/cheese|keju/.test(lower)) tags.push('keju', 'creamy');
  if (/spicy|pedas/.test(lower)) tags.push('pedas');
  if (/bbq/.test(lower)) tags.push('bbq', 'smoky');
  if (/thai/.test(lower)) tags.push('thai', 'asia');
  if (/japanese|jepang/.test(lower)) tags.push('japanese');
  if (/mexican|mexico/.test(lower)) tags.push('mexican');
  if (/indian/.test(lower)) tags.push('indian', 'kari');
  if (/french|prancis/.test(lower)) tags.push('french');
  if (/italian|italia/.test(lower)) tags.push('italian');
  if (/greek|yunani/.test(lower)) tags.push('greek', 'mediterranean');
  if (/seafood|fish|shrimp|salmon|lobster|crab/.test(lower)) tags.push('seafood');
  if (/vegetarian|vegan/.test(lower)) tags.push('vegetarian');
  if (/healthy|sehat/.test(lower)) tags.push('sehat');
  if (/breakfast|sarapan/.test(lower)) tags.push('sarapan');
  if (/dessert/.test(lower)) tags.push('dessert');
  if (/quick|cepat|easy|mudah/.test(lower)) tags.push('cepat saji');
  if (/classic|klasik/.test(lower)) tags.push('klasik');
  if (/lamb/.test(lower)) tags.push('lamb', 'daging');
  if (/pork/.test(lower)) tags.push('pork', 'babi');
  
  if (tags.length === 0) tags.push('western', 'populer');
  return tags.slice(0, 5);
}

function generateId(name) {
  return 'w-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/g, '').replace(/^-+/g, '');
}

// Generate recipes
const allRecipeTemplates = [
  ...breakfastRecipes.map(r => ({ ...r, mealType: 'Sarapan' })),
  ...lunchRecipes.map(r => ({ ...r, mealType: 'Makan Siang' })),
  ...dinnerRecipes.map(r => ({ ...r, mealType: 'Makan Malam' })),
  ...snackRecipes.map(r => ({ ...r, mealType: 'Snack' })),
  ...dessertRecipes.map(r => ({ ...r, mealType: 'Dessert' })),
  ...drinkRecipes.map(r => ({ ...r, mealType: 'Minuman' })),
];

const recipes = [];

for (const tmpl of allRecipeTemplates) {
  const difficulty = getDifficulty();
  const cookTime = difficulty === 'Mudah' ? Math.floor(Math.random() * 15) + 5 :
                   difficulty === 'Sedang' ? Math.floor(Math.random() * 20) + 15 :
                   Math.floor(Math.random() * 40) + 30;
  const prepTime = difficulty === 'Mudah' ? Math.floor(Math.random() * 10) + 5 :
                   difficulty === 'Sedang' ? Math.floor(Math.random() * 15) + 10 :
                   Math.floor(Math.random() * 25) + 15;
  const servings = Math.floor(Math.random() * 4) + 2;
  const rating = Math.round((4 + Math.random() * 0.9) * 10) / 10;

  recipes.push({
    id: generateId(tmpl.name),
    name: tmpl.name,
    description: tmpl.desc,
    image: tmpl.emoji,
    category: 'Western',
    difficulty,
    cookTime,
    prepTime,
    servings,
    calories: tmpl.cal,
    ingredients: generateIngredients(tmpl.name, tmpl.emoji, tmpl.cal),
    steps: generateSteps(tmpl.name, tmpl.emoji),
    tags: generateTags(tmpl.name),
    rating,
  });
}

// If we have less than 300, add more variants
const prefixes = ['Classic ', 'Crispy ', 'Creamy ', 'Spicy ', 'Herb ', 'Smoky ', 'Garlic ', 'Lemon ', 'Honey ', 'Grilled '];
const suffixes = [' Supreme', ' Deluxe', ' Royale', ' House Special', ' Signature', ' with Truffle', ' with Parmesan', ' Provençal', ' alla Vodka', ' au Gratin'];

const extraDishes = [
  { name: 'Ravioli Ricotta Spinach', desc: 'Ravioli isi ricotta dan bayam dengan saus marinara.', emoji: '🍝', cal: 440, mealType: 'Makan Malam' },
  { name: 'Quiche Mushroom Cheese', desc: 'Quiche jamur dengan keju Gruyere dan krim.', emoji: '🥧', cal: 380, mealType: 'Sarapan' },
  { name: 'Potato Gratin Dauphinois', desc: 'Kentang iris panggang dengan krim dan keju.', emoji: '🥔', cal: 360, mealType: 'Makan Malam' },
  { name: 'Steak Frites', desc: 'Steak daging sapi dengan kentang goreng renyah.', emoji: '🥩', cal: 580, mealType: 'Makan Malam' },
  { name: 'Beef Tatar', desc: 'Daging sapi cincang mentah dengan kuning telur dan capers.', emoji: '🥩', cal: 340, mealType: 'Makan Siang' },
  { name: 'Tomato Mozzarella Caprese', desc: 'Irisan tomat dan mozzarella dengan basil dan olive oil.', emoji: '🍅', cal: 200, mealType: 'Snack' },
  { name: 'Grilled Vegetables', desc: 'Sayuran panggang Mediterranean dengan balsamic glaze.', emoji: '🫑', cal: 180, mealType: 'Snack' },
  { name: 'Fish Pie', desc: 'Pie ikan krim dengan kentang mashed di atas.', emoji: '🥧', cal: 440, mealType: 'Makan Malam' },
  { name: 'Prawn Cocktail', desc: 'Udang rebus dengan saus cocktail Marie Rose.', emoji: '🦐', cal: 200, mealType: 'Snack' },
  { name: 'Shakshuka Eggs', desc: 'Telur dimasak dalam saus tomat pedas khas Timur Tengah.', emoji: '🍳', cal: 280, mealType: 'Sarapan' },
  { name: 'Banoffee Pie', desc: 'Pie banana dan toffee dengan whipped cream.', emoji: '🥧', cal: 420, mealType: 'Dessert' },
  { name: 'Bangers and Mash', desc: 'Sosis Inggris dengan kentang mashed dan gravy.', emoji: '🌭', cal: 480, mealType: 'Makan Malam' },
  { name: 'Croque Monsieur', desc: 'Sandwich ham dan keju panggang dengan bechamel.', emoji: '🥪', cal: 400, mealType: 'Sarapan' },
  { name: 'Ratatouille Provencal', desc: 'Sayuran panggang berlapis khas Provence Prancis.', emoji: '🍆', cal: 220, mealType: 'Makan Siang' },
  { name: 'Moules Frites', desc: 'Kerang dimasak dengan white wine dan kentang goreng.', emoji: '🦪', cal: 380, mealType: 'Makan Malam' },
  { name: 'Creme Brulee Vanilla', desc: 'Custard vanilla Prancis dengan gula karamelisasi.', emoji: '🍮', cal: 300, mealType: 'Dessert' },
  { name: 'Beef Carpaccio Arugula', desc: 'Daging sapi mentah tipis dengan arugula dan parmesan.', emoji: '🥗', cal: 260, mealType: 'Makan Siang' },
  { name: 'Oysters Rockefeller', desc: 'Tiram panggang dengan bayam, herbs, dan breadcrumbs.', emoji: '🦪', cal: 220, mealType: 'Snack' },
  { name: 'Wiener Schnitzel', desc: 'Daging anak sapi goreng tepung roti khas Austria.', emoji: '🥩', cal: 460, mealType: 'Makan Malam' },
  { name: 'Pierogi Dumplings', desc: 'Dumpling Polandia isi kentang dan keju.', emoji: '🥟', cal: 340, mealType: 'Snack' },
  { name: 'Croissant Almond', desc: 'Croquet Prancis dengan isian krim almond.', emoji: '🥐', cal: 340, mealType: 'Sarapan' },
  { name: 'Tuna Tartare', desc: 'Tuna mentah cincang dengan avocado dan sesame.', emoji: '🐟', cal: 240, mealType: 'Makan Siang' },
  { name: 'Lobster Macaroni', desc: 'Macaroni dengan lobster dan saus keju creamy.', emoji: '🦞', cal: 540, mealType: 'Makan Malam' },
  { name: 'Creme Caramel Vanilla', desc: 'Flan vanilla lembut dengan karamel.', emoji: '🍮', cal: 260, mealType: 'Dessert' },
  { name: 'Steak Tartare', desc: 'Daging sapi cincang dengan kuning telur dan capers.', emoji: '🥩', cal: 320, mealType: 'Makan Siang' },
  { name: 'French Onion Gratin', desc: 'Sup bawang Prancis dengan crouton dan keju.', emoji: '🍲', cal: 340, mealType: 'Makan Siang' },
  { name: 'Beef Stroganoff Classic', desc: 'Daging sapi dengan saus krim jamur dan noodles.', emoji: '🥘', cal: 520, mealType: 'Makan Malam' },
  { name: 'Pastry Palmier', desc: 'Pastry puff bentuk daun dengan gula karamel.', emoji: '🥐', cal: 240, mealType: 'Snack' },
  { name: 'Chicken Kiev Classic', desc: 'Ayam goreng berisi mentega garlic dan herbs.', emoji: '🍗', cal: 500, mealType: 'Makan Malam' },
  { name: 'Trifle Berry', desc: 'Dessert berlapis dengan custard dan buah berry.', emoji: '🍮', cal: 340, mealType: 'Dessert' },
];

// Add extra dishes
for (const dish of extraDishes) {
  const difficulty = getDifficulty();
  const cookTime = difficulty === 'Mudah' ? Math.floor(Math.random() * 15) + 5 :
                   difficulty === 'Sedang' ? Math.floor(Math.random() * 20) + 15 :
                   Math.floor(Math.random() * 40) + 30;
  const prepTime = difficulty === 'Mudah' ? Math.floor(Math.random() * 10) + 5 :
                   difficulty === 'Sedang' ? Math.floor(Math.random() * 15) + 10 :
                   Math.floor(Math.random() * 25) + 15;
  const servings = Math.floor(Math.random() * 4) + 2;
  const rating = Math.round((4 + Math.random() * 0.9) * 10) / 10;

  recipes.push({
    id: generateId(dish.name),
    name: dish.name,
    description: dish.desc,
    image: dish.emoji,
    category: 'Western',
    difficulty,
    cookTime,
    prepTime,
    servings,
    calories: dish.cal,
    ingredients: generateIngredients(dish.name, dish.emoji, dish.cal),
    steps: generateSteps(dish.name, dish.emoji),
    tags: generateTags(dish.name),
    rating,
  });
}

// Generate variant recipes to reach 300
let counter = recipes.length;
const baseNames = ['Pasta', 'Steak', 'Salad', 'Soup', 'Burger', 'Sandwich', 'Chicken', 'Fish', 'Dessert', 'Pizza', 'Rice', 'Wrap', 'Taco', 'Cake', 'Smoothie'];
const baseEmojis = {'Pasta':'🍝','Steak':'🥩','Salad':'🥗','Soup':'🍲','Burger':'🍔','Sandwich':'🥪','Chicken':'🍗','Fish':'🐟','Dessert':'🍰','Pizza':'🍕','Rice':'🍚','Wrap':'🌯','Taco':'🌮','Cake':'🍰','Smoothie':'🥤'};
const baseMeals = {
  'Pasta': ['Makan Siang','Makan Malam'], 'Steak': ['Makan Malam'], 'Salad': ['Makan Siang','Snack'],
  'Soup': ['Makan Siang'], 'Burger': ['Makan Siang','Makan Malam'], 'Sandwich': ['Makan Siang','Sarapan'],
  'Chicken': ['Makan Malam','Makan Siang'], 'Fish': ['Makan Malam','Makan Siang'], 'Dessert': ['Dessert'],
  'Pizza': ['Makan Siang','Makan Malam'], 'Rice': ['Makan Siang','Makan Malam'], 'Wrap': ['Makan Siang'],
  'Taco': ['Makan Siang','Makan Malam'], 'Cake': ['Dessert','Snack'], 'Smoothie': ['Minuman','Snack']
};
const flavorWords = ['Truffle', 'Pepper', 'Lemon Herb', 'Garlic Butter', 'Smoky BBQ', 'Parmesan', 'Mushroom', 'Basil Pesto', 'Spicy Cajun', 'Honey Mustard', 'Rosemary', 'Cheddar', 'Mediterranean', 'Thai Style', 'Pesto Cream', 'White Wine', 'Sun-Dried Tomato', 'Four Cheese', 'Black Pepper', 'Maple Glazed', 'Cajun Spice', 'Herb Crusted', 'Pan-Seared', 'Slow-Cooked', 'Smoked', 'Roasted', 'Crispy', 'Creamy', 'Zesty', 'Tuscan', 'Provencal'];

while (recipes.length < 300) {
  const base = baseNames[counter % baseNames.length];
  const flavor = flavorWords[Math.floor(Math.random() * flavorWords.length)];
  const name = `${flavor} ${base}`;
  
  // Skip duplicates
  if (recipes.some(r => r.name === name)) { counter++; continue; }
  
  const difficulty = getDifficulty();
  const cookTime = difficulty === 'Mudah' ? Math.floor(Math.random() * 15) + 5 :
                   difficulty === 'Sedang' ? Math.floor(Math.random() * 20) + 15 :
                   Math.floor(Math.random() * 40) + 30;
  const prepTime = difficulty === 'Mudah' ? Math.floor(Math.random() * 10) + 5 :
                   difficulty === 'Sedang' ? Math.floor(Math.random() * 15) + 10 :
                   Math.floor(Math.random() * 25) + 15;
  const servings = Math.floor(Math.random() * 4) + 2;
  const calories = 250 + Math.floor(Math.random() * 300);
  const mealOptions = baseMeals[base] || ['Makan Siang'];
  const rating = Math.round((4 + Math.random() * 0.9) * 10) / 10;

  recipes.push({
    id: generateId(name),
    name,
    description: `${name} yang lezat dan menggugah selera, dibuat dengan bahan-bahan berkualitas.`,
    image: baseEmojis[base] || '🍽️',
    category: 'Western',
    difficulty,
    cookTime,
    prepTime,
    servings,
    calories,
    ingredients: generateIngredients(name, baseEmojis[base] || '🍽️', calories),
    steps: generateSteps(name, baseEmojis[base] || '🍽️'),
    tags: generateTags(name).slice(0, 5),
    rating,
  });
  counter++;
}

console.log(`Generated ${recipes.length} Western recipes`);

// Write the file
const header = `import type { Recipe } from '@/types';

export const westernRecipes: Recipe[] = [
`;

const entries = recipes.map(r => {
  const indent = '  ';
  return `${indent}{
${indent}  id: '${r.id}',
${indent}  name: '${r.name.replace(/'/g, "\\'")}',
${indent}  description: '${r.description.replace(/'/g, "\\'")}',
${indent}  image: '${r.image}',
${indent}  category: 'Western',
${indent}  difficulty: '${r.difficulty}',
${indent}  cookTime: ${r.cookTime},
${indent}  prepTime: ${r.prepTime},
${indent}  servings: ${r.servings},
${indent}  calories: ${r.calories},
${indent}  ingredients: ${JSON.stringify(r.ingredients)},
${indent}  steps: ${JSON.stringify(r.steps)},
${indent}  tags: ${JSON.stringify(r.tags)},
${indent}  rating: ${r.rating},
${indent}},`;
}).join('\n\n');

const footer = `\n];\n`;

const output = header + entries + footer;
fs.writeFileSync('/home/z/my-project/src/lib/recipes/western.ts', output, 'utf-8');
console.log('Written to /home/z/my-project/src/lib/recipes/western.ts');
