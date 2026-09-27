export type MenuItem = { name: string; price: number; desc?: string; descEn?: string; photo?: string; featured?: boolean };
export type MenuGroup = { title?: string; titleEn?: string; note?: string; noteEn?: string; items: MenuItem[] };
export type MenuSection = { id: string; title: string; titleEn: string; hero?: string; note?: string; noteEn?: string; combo?: string; comboEn?: string; groups: MenuGroup[]; extras?: { title: string; titleEn: string; items: { name: string; price: number }[] } };

const SALAD = "sałatka z sosem vinaigrette";

export const MENU: MenuSection[] = [
  {
    id: "sniadania",
    titleEn: "Breakfasts",
    title: "Śniadania",
    hero: "velure-premium",
    combo: "Dodaj kawę do śniadania: Americano lub Cappuccino tylko +9 zł",
    comboEn: "Add a coffee to your breakfast: Americano or Cappuccino for just +9 zł",
    groups: [
      {
        items: [
          { name: "Veluré Premium", descEn: "3-egg omelette, cream cheese, cold-smoked salmon, avocado, toast, butter and a salad of cherry tomatoes, rocket, spinach, microgreens, pumpkin and sunflower seeds, with vinaigrette.", price: 42, photo: "velure-premium", featured: true, desc: "Omlet z 3 jajek, serek śmietankowy, wędzony na zimno łosoś, awokado, grzanki, masło oraz sałatka z pomidorkami, rukolą, szpinakiem, microgreens, pestkami dyni i słonecznika, z sosem vinaigrette." },
          { name: "English Breakfast", descEn: "2 fried eggs, bacon, sausages, mushrooms, grilled tomatoes, beans, toast and honey-mustard sauce.", price: 35, photo: "english-breakfast", featured: true, desc: "2 jajka sadzone, bekon, kiełbaski, pieczarki, grillowane pomidory, fasolka, grzanki oraz sos miodowo-musztardowy." },
          { name: "Omlet Sunrise", descEn: "3-egg omelette, toast, butter, mushroom sauce and a salad with vinaigrette.", price: 29, photo: "omlet-sunrise", desc: `Omlet z 3 jajek, grzanki, masło, sos pieczarkowy oraz ${SALAD}.` },
          { name: "Jajecznica z bekonem", descEn: "3-egg scrambled eggs, bacon, toast, butter and a salad with vinaigrette.", price: 32, photo: "jajecznica-bekon", desc: `Jajecznica z 3 jajek, bekon, grzanki, masło oraz ${SALAD}.` },
          { name: "Jajecznica z parmezanem", descEn: "2-egg scrambled eggs cooked in butter, parmesan, sourdough bread.", price: 25, photo: "jajecznica-parmezan", desc: "Jajecznica z 2 jaj smażona na maśle, parmezan, chleb na zakwasie." },
        ],
      },
    ],
    extras: {
      title: "Dodatki do dań",
      titleEn: "Extras",
      items: [
        { name: "Ser", price: 3 },
        { name: "Pieczarki", price: 3 },
        { name: "Dodatkowe jajko", price: 3 },
        { name: "Połówka awokado", price: 10 },
        { name: "Bekon", price: 7 },
        { name: "Kiełbaski 2 szt.", price: 7 },
        { name: "Plasterki łososia wędzonego", price: 14 },
        { name: "Koszyk pieczywa z masłem", price: 7 },
        { name: "Sałatka", price: 9 },
      ],
    },
  },
  {
    id: "brunch",
    titleEn: "Brunch & bagels",
    title: "Brunch i bajgle",
    hero: "bajgiel-losos",
    groups: [
      {
        title: "Brunch",
        titleEn: "Brunch",
        items: [
          { name: "Avocado Toast", descEn: "Avocado, lime, poached egg, smoked tomatoes, rocket salad, cherry tomatoes, microgreens, pumpkin and sunflower seeds, sourdough bread.", price: 31, photo: "avocado-toast", desc: "Awokado, limonka, jajko poché, wędzone pomidory, sałatka z rukoli, pomidorki cherry, microgreens, pestki dyni i słonecznika, chleb na zakwasie." },
          { name: "Tost Łosoś & Awokado", descEn: "Guacamole, lime, soft-boiled egg, salmon, microgreens, sourdough bread.", price: 36, photo: "tost-losos-awokado", desc: "Guacamole, limonka, jajko na miękko, łosoś, microgreens, chleb na zakwasie." },
        ],
      },
      {
        title: "Bajgle",
        titleEn: "Bagels",
        items: [
          { name: "Bajgiel z łososiem", descEn: "Smoked salmon, avocado, scrambled eggs, spinach, cream cheese, tomato and rocket.", price: 38, photo: "bajgiel-losos", featured: true, desc: "Wędzony łosoś, awokado, jajecznica, szpinak, serek kremowy, pomidor i rukola." },
          { name: "Bajgiel z bekonem", descEn: "Omelette, mushrooms, crispy bacon, cheese, tomato, spinach and honey-mustard sauce.", price: 29, photo: "bajgiel-bekon", desc: "Omlet, pieczarki, chrupiący bekon, ser, pomidor, szpinak i sos miodowo-musztardowy." },
        ],
      },
    ],
  },
  {
    id: "slodko",
    titleEn: "Sweet breakfasts",
    title: "Na słodko",
    groups: [{ items: [{ name: "French Toast", descEn: "Butter brioche, eggs, milk, maple syrup, icing sugar and seasonal fruit.", price: 25, desc: "Maślana brioszka, jajka, mleko, syrop klonowy, cukier puder i sezonowe owoce." }] }],
  },
  {
    id: "kawa",
    titleEn: "Coffee",
    title: "Kawa",
    hero: "flat-white",
    note: "Dostępna również kawa bezkofeinowa",
    noteEn: "Decaf coffee is also available",
    groups: [
      {
        items: [
          { name: "Espresso", price: 9, photo: "espresso" },
          { name: "Lungo", price: 9, photo: "lungo" },
          { name: "Ristretto", price: 9, photo: "ristretto" },
          { name: "Doppio", price: 12, photo: "doppio" },
          { name: "Americano", price: 13, photo: "americano" },
          { name: "Americano z mlekiem", price: 14, photo: "americano-mleko" },
          { name: "Cappuccino", price: 16, photo: "cappuccino" },
          { name: "Flat White", price: 17, photo: "flat-white" },
          { name: "Latte", price: 17 },
          { name: "Mokka", price: 21, photo: "mokka" },
          { name: "Karmelowe Latte", price: 21, photo: "karmelowe-latte" },
        ],
      },
    ],
    extras: {
      title: "Dodatki do kawy",
      titleEn: "Coffee add-ons",
      items: [
        { name: "Mleko roślinne", price: 3 },
        { name: "Syrop", price: 2 },
        { name: "Dodatkowe espresso", price: 3 },
      ],
    },
  },
  {
    id: "iced",
    titleEn: "Iced coffee & matcha",
    title: "Iced coffee i matcha",
    hero: "ice-latte",
    groups: [
      {
        title: "Iced coffee",
        titleEn: "Iced coffee",
        items: [
          { name: "Ice Americano", price: 16, photo: "ice-americano" },
          { name: "Ice Latte", price: 17, photo: "ice-latte" },
          { name: "Vanilla Ice Latte", price: 21, photo: "vanilla-ice-latte" },
          { name: "Espresso Tonic", price: 17, photo: "espresso-tonic" },
          { name: "Capuorange", price: 17, photo: "capuorange" },
          { name: "Affogato", price: 17, photo: "affogato" },
          { name: "Honey Lemon Tonic", price: 20, photo: "honey-lemon-tonic" },
          { name: "Frappe", price: 21, photo: "frappe" },
        ],
      },
      {
        title: "Matcha",
        titleEn: "Matcha",
        note: "Mleko i syrop do wyboru.",
        noteEn: "Choice of milk and syrup.",
        items: [
          { name: "Ice Matcha Latte", price: 25, photo: "ice-matcha-latte" },
          { name: "Orange Matcha", price: 25, photo: "orange-matcha" },
          { name: "Ice Tonic Matcha", price: 23, photo: "ice-tonic-matcha" },
          { name: "Latte Matcha", price: 25, photo: "latte-matcha" },
        ],
      },
    ],
  },
  {
    id: "inne",
    titleEn: "Other drinks",
    title: "Inne napoje",
    groups: [
      { title: "Cold drinks", titleEn: "Cold drinks", items: [{ name: "Lemoniada", descEn: "Syrup, tonic, seasonal fruit.", price: 17, desc: "Syrop, tonik, owoce sezonowe." }] },
      {
        title: "Hot drinks",
        titleEn: "Hot drinks",
        items: [
          { name: "Herbata w dzbanku z miodem i limonką", price: 19, photo: "herbata" },
          { name: "Kakao gorzkie", price: 14, photo: "kakao-gorzkie" },
          { name: "Kakao kokosowe", price: 16 },
          { name: "Napój czekoladowy", price: 16 },
        ],
      },
    ],
  },
  {
    id: "dzieci",
    titleEn: "For the little ones",
    title: "Dla najmłodszych",
    groups: [
      {
        items: [
          { name: "Mini śniadanko Veluré", descEn: "Gentle 2-egg omelette, bread, butter, cherry tomatoes and seasonal fruit.", price: 23, desc: "Delikatny omlet z 2 jaj, pieczywo, masło, pomidorki oraz sezonowe owoce." },
          { name: "Babychino", descEn: "Gentle warm milk, biscuits.", price: 10, desc: "Delikatne ciepłe mleko, ciasteczka." },
        ],
      },
    ],
  },
];

export const CAFE = {
  address: "Erazma Ciołka 25, 01-445 Warszawa",
  district: "Wola, osiedle Koło",
  hours: ["poniedziałek 12:30–20:00", "wtorek–niedziela 9:00–20:00"],
  hoursShort: "Pn 12:30–20:00 · Wt–Nd 9:00–20:00",
  phone: "575 602 489",
  phoneHref: "tel:+48575602489",
  mapsHref: "https://maps.app.goo.gl/HCWvBtR3jByYmzCWA",
};
