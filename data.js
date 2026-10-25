const STALLS = [
  {
    id: 1,
    name: "Aling Nena's Isawan",
    lat: 14.59810,
    lng: 121.01012,
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
    lat: 14.59809,
    lng: 121.01018,
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
    lat: 14.59810,
    lng: 121.01025,
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
    lat: 14.59812,
    lng: 121.01031,
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
    lat: 14.59815,
    lng: 121.01037,
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
    lat: 14.59817,
    lng: 121.01044,
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
  { name: "Silog Station", category: "Rice meals", emoji: "🍳", dish: "Tapsilog", price: 85, lat: 14.59813, lng: 121.01049 },
  { name: "PUP Pares House", category: "Rice meals", emoji: "🍲", dish: "Beef pares", price: 75, lat: 14.59808, lng: 121.01054 },
  { name: "Merienda ni Isko", category: "Street food", emoji: "🥟", dish: "Kwek-kwek (6 pcs)", price: 50, lat: 14.59803, lng: 121.01058 },
  { name: "Snack Stop", category: "Street food", emoji: "🍟", dish: "Cheese fries", price: 55, lat: 14.59799, lng: 121.01061 },
  { name: "Campus Brew", category: "Drinks", emoji: "☕", dish: "Iced coffee", price: 65, lat: 14.59797, lng: 121.01065 },
  { name: "Pearl & Tea", category: "Drinks", emoji: "🧋", dish: "Classic milk tea", price: 75, lat: 14.59788, lng: 121.01070 },
  { name: "Sweet Spot", category: "Dessert", emoji: "🍰", dish: "Slice of cake", price: 60, lat: 14.59779, lng: 121.01067 },
  { name: "Banana Break", category: "Dessert", emoji: "🍌", dish: "Turon (3 pcs)", price: 35, lat: 14.59772, lng: 121.01068 },
  { name: "Grill ni Kuya", category: "Grill", emoji: "🍗", dish: "Chicken barbecue", price: 90, lat: 14.59766, lng: 121.01068 },
  { name: "Sisig Express", category: "Rice meals", emoji: "🍚", dish: "Pork sisig rice", price: 95, lat: 14.59760, lng: 121.01067 },
  { name: "Noodle Nook", category: "Rice meals", emoji: "🍜", dish: "Pancit canton", price: 65, lat: 14.59754, lng: 121.01066 },
  { name: "Fishball Tambayan", category: "Street food", emoji: "🍡", dish: "Fishball cup", price: 25, lat: 14.59748, lng: 121.01065 },
  { name: "Fruit Shake Corner", category: "Drinks", emoji: "🥤", dish: "Mango shake", price: 60, lat: 14.59741, lng: 121.01063 },
  { name: "Cool Cup", category: "Drinks", emoji: "🧋", dish: "Wintermelon milk tea", price: 80, lat: 14.59735, lng: 121.01062 },
  { name: "Cookie Crumbs", category: "Dessert", emoji: "🍪", dish: "Chocolate cookie", price: 35, lat: 14.59730, lng: 121.01059 },
  { name: "Halo-Halo Hub", category: "Dessert", emoji: "🍧", dish: "Halo-halo", price: 75, lat: 14.59725, lng: 121.01055 },
  { name: "Sizzling Plate", category: "Grill", emoji: "🥩", dish: "Pork barbecue rice", price: 100, lat: 14.59721, lng: 121.01050 },
  { name: "Tita's Lugawan", category: "Rice meals", emoji: "🥣", dish: "Lugaw with egg", price: 35, lat: 14.59718, lng: 121.01044 },
  { name: "PUP Burger Cart", category: "Street food", emoji: "🍔", dish: "Cheeseburger", price: 60, lat: 14.59716, lng: 121.01038 },
  { name: "Corn & Co.", category: "Street food", emoji: "🌽", dish: "Cheese corn cup", price: 40, lat: 14.59717, lng: 121.01032 },
  { name: "Fresh Start", category: "Drinks", emoji: "🍋", dish: "Calamansi juice", price: 30, lat: 14.59719, lng: 121.01026 },
  { name: "Waffle Walk", category: "Dessert", emoji: "🧇", dish: "Classic waffle", price: 50, lat: 14.59722, lng: 121.01020 }
];

DEMO_STALLS.forEach(({ name, category, emoji, dish, price, lat, lng }, index) => {
  STALLS.push({
    id: index + 7,
    name,
    lat,
    lng,
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

STALLS.forEach((stall, index) => {
  stall.open = 0;
  stall.close = 24;
  // Set these to the vendor's own QR image paths when they are available.
  stall.paymentQr = stall.paymentQr || { gcash: "", maya: "" };
});
