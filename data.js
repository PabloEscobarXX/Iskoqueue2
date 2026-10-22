// Sample data. All businesses are made up – replace with your own.
// Demo markers arranged along the loop outlined around Luntiang Pilipinas Forest Park.
// Fine-tune them: right-click the exact spot in Google Maps and click the numbers to copy lat/lng.
//
// open/close: 24-hour clock (e.g. 17 = 5:00 PM). If close < open, it closes after midnight.

const STALLS = [
  {
    id: 1,
    name: "Aling Nena's Isawan",
    category: "Street food",
    emoji: "🍢",
    color: "#F2C230",
    area: "Luntiang Pilipinas Forest Park loop",
    open: 10,
    close: 20,
    rating: 4.7,
    deliveryFee: 15,
    eta: "5–10 min",
    menu: [
      { name: "Isaw (5 sticks)", price: 45, desc: "Grilled chicken intestine, vinegar dip" },
      { name: "Betamax (5 sticks)", price: 40, desc: "Grilled blood cubes" },
      { name: "Kwek-kwek (6 pcs)", price: 50, desc: "Battered quail eggs, sweet sauce" },
      { name: "Fishball cup", price: 25, desc: "With sweet, spicy and vinegar sauces" }
    ]
  },
  {
    id: 2,
    name: "Iskolar Silogan",
    category: "Rice meals",
    emoji: "🍳",
    color: "#6B3FA0",
    area: "Luntiang Pilipinas Forest Park loop",
    open: 6,
    close: 18,
    rating: 4.5,
    deliveryFee: 15,
    eta: "5–15 min",
    menu: [
      { name: "Tapsilog", price: 85, desc: "Beef tapa, garlic rice, fried egg" },
      { name: "Longsilog", price: 65, desc: "Longganisa, garlic rice, fried egg" },
      { name: "Tocilog", price: 65, desc: "Sweet cured pork, garlic rice, fried egg" },
      { name: "Iced tea (glass)", price: 20, desc: "House blend" }
    ]
  },
  {
    id: 3,
    name: "Maroon Milk Tea Co.",
    category: "Drinks",
    emoji: "🧋",
    color: "#3E8E6B",
    area: "Luntiang Pilipinas Forest Park loop",
    open: 9,
    close: 19,
    rating: 4.6,
    deliveryFee: 15,
    eta: "5–10 min",
    menu: [
      { name: "Classic milk tea (L)", price: 75, desc: "Black tea, pearls, 50% sugar" },
      { name: "Wintermelon (L)", price: 80, desc: "Cream cheese foam optional" },
      { name: "Matcha latte (L)", price: 95, desc: "Uji-style matcha, fresh milk" },
      { name: "Add pearls", price: 10, desc: "Extra tapioca" }
    ]
  },
  {
    id: 4,
    name: "Lugaw ni Mang Berto",
    category: "Rice meals",
    emoji: "🥣",
    color: "#D1495B",
    area: "Luntiang Pilipinas Forest Park loop",
    open: 7,
    close: 17,
    rating: 4.4,
    deliveryFee: 15,
    eta: "5–15 min",
    menu: [
      { name: "Goto (regular)", price: 50, desc: "Beef tripe rice porridge, toasted garlic" },
      { name: "Lugaw with egg", price: 35, desc: "Plain porridge, boiled egg" },
      { name: "Tokwa't baboy", price: 60, desc: "Fried tofu and pork in soy-vinegar" }
    ]
  },
  {
    id: 5,
    name: "Turon Cart ni Ate Joy",
    category: "Dessert",
    emoji: "🍌",
    color: "#E07A1F",
    area: "Luntiang Pilipinas Forest Park loop",
    open: 13,
    close: 19,
    rating: 4.8,
    deliveryFee: 10,
    eta: "5–10 min",
    menu: [
      { name: "Turon (3 pcs)", price: 35, desc: "Saba banana and langka in caramelized wrapper" },
      { name: "Banana cue (3 sticks)", price: 30, desc: "Deep-fried, brown sugar glaze" },
      { name: "Maruya (4 pcs)", price: 30, desc: "Banana fritters with sugar" }
    ]
  },
  {
    id: 6,
    name: "Inihaw Corner",
    category: "Grill",
    emoji: "🍗",
    color: "#B5451B",
    area: "Luntiang Pilipinas Forest Park loop",
    open: 11,
    close: 20,
    rating: 4.6,
    deliveryFee: 20,
    eta: "10–15 min",
    menu: [
      { name: "Chicken inasal (1 pc)", price: 110, desc: "Marinated grilled chicken, rice, atsara" },
      { name: "Liempo (200 g)", price: 140, desc: "Grilled pork belly, soy-calamansi dip" },
      { name: "Grilled bangus", price: 150, desc: "Stuffed milkfish, tomato-onion topping" },
      { name: "Extra rice", price: 15, desc: "" }
    ]
  }
];

// Additional demo listings bring the prototype to the requested 28 stalls.
const DEMO_STALLS = [
  ["Silog Station", "Rice meals", "🍳", "Tapsilog", 85],
  ["PUP Pares House", "Rice meals", "🍲", "Beef pares", 75],
  ["Merienda ni Isko", "Street food", "🥟", "Kwek-kwek (6 pcs)", 50],
  ["Snack Stop", "Street food", "🍟", "Cheese fries", 55],
  ["Campus Brew", "Drinks", "☕", "Iced coffee", 65],
  ["Pearl & Tea", "Drinks", "🧋", "Classic milk tea", 75],
  ["Sweet Spot", "Dessert", "🍰", "Slice of cake", 60],
  ["Banana Break", "Dessert", "🍌", "Turon (3 pcs)", 35],
  ["Grill ni Kuya", "Grill", "🍗", "Chicken barbecue", 90],
  ["Sisig Express", "Rice meals", "🍚", "Pork sisig rice", 95],
  ["Noodle Nook", "Rice meals", "🍜", "Pancit canton", 65],
  ["Fishball Tambayan", "Street food", "🍡", "Fishball cup", 25],
  ["Fruit Shake Corner", "Drinks", "🥤", "Mango shake", 60],
  ["Cool Cup", "Drinks", "🧋", "Wintermelon milk tea", 80],
  ["Cookie Crumbs", "Dessert", "🍪", "Chocolate cookie", 35],
  ["Halo-Halo Hub", "Dessert", "🍧", "Halo-halo", 75],
  ["Sizzling Plate", "Grill", "🥩", "Pork barbecue rice", 100],
  ["Tita's Lugawan", "Rice meals", "🥣", "Lugaw with egg", 35],
  ["PUP Burger Cart", "Street food", "🍔", "Cheeseburger", 60],
  ["Corn & Co.", "Street food", "🌽", "Cheese corn cup", 40],
  ["Fresh Start", "Drinks", "🍋", "Calamansi juice", 30],
  ["Waffle Walk", "Dessert", "🧇", "Classic waffle", 50]
];

DEMO_STALLS.forEach(([name, category, emoji, dish, price], index) => {
  STALLS.push({
    id: index + 7,
    name,
    category,
    emoji,
    color: ["#D1495B", "#E07A1F", "#3E8E6B", "#6B3FA0"][index % 4],
    area: "Luntiang Pilipinas Forest Park loop",
    open: 7,
    close: 19,
    rating: 4.2 + (index % 7) / 10,
    deliveryFee: 15,
    eta: "5–15 min",
    menu: [{ name: dish, price, desc: "Sample menu item" }]
  });
});

const parkLoopCoordinates = [
  [14.59804, 121.00986], [14.59810, 121.00999], [14.59813, 121.01013],
  [14.59814, 121.01027], [14.59812, 121.01040], [14.59808, 121.01052],
  [14.59801, 121.01063], [14.59794, 121.01073], [14.59785, 121.01081],
  [14.59774, 121.01087], [14.59761, 121.01090], [14.59748, 121.01089],
  [14.59736, 121.01085], [14.59725, 121.01078], [14.59717, 121.01067],
  [14.59713, 121.01054], [14.59712, 121.01040], [14.59714, 121.01026],
  [14.59717, 121.01012], [14.59721, 121.00999], [14.59727, 121.00987],
  [14.59736, 121.00980], [14.59748, 121.00977], [14.59761, 121.00978],
  [14.59773, 121.00981], [14.59784, 121.00983], [14.59794, 121.00984],
  [14.59801, 121.00985]
];

STALLS.forEach((stall, index) => {
  [stall.lat, stall.lng] = parkLoopCoordinates[index];
  stall.open = 0;
  stall.close = 24;
  // Set these to the vendor's own QR image paths when they are available.
  stall.paymentQr = stall.paymentQr || { gcash: "", maya: "" };
});
