import bryggen from "@/assets/venue-bryggen.jpg";
import rooftop from "@/assets/venue-rooftop.jpg";
import fisketorget from "@/assets/venue-fisketorget.jpg";
import student from "@/assets/venue-student.jpg";
import nordnes from "@/assets/venue-nordnes.jpg";
import family from "@/assets/venue-family.jpg";
import wine from "@/assets/venue-wine.jpg";
import brewery from "@/assets/venue-brewery.jpg";
import coffee from "@/assets/venue-coffee.jpg";
import floyen from "@/assets/venue-floyen.jpg";
import cocktail from "@/assets/venue-cocktail.jpg";
import pizza from "@/assets/venue-pizza.jpg";

export type SunStatus = "sun-now" | "sun-until" | "evening-sun" | "shade-soon" | "shade";

export interface Venue {
  id: string;
  name: string;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  priceLevel: 1 | 2 | 3 | 4;
  sunScore: number; // 0-100
  sunStatus: SunStatus;
  sunUntil?: string;
  dealText?: string;
  familyFriendly: boolean;
  trending?: boolean;
  tags: string[];
  description: string;
  hours: string;
  area: string;
  lat: number;
  lng: number;
}

export const venues: Venue[] = [
  {
    id: "bryggen-bar",
    name: "Bryggen Bar",
    image: bryggen,
    category: "Utebar",
    rating: 4.7, reviews: 842,
    priceLevel: 2,
    sunScore: 92, sunStatus: "sun-now", sunUntil: "19:40",
    dealText: "2-for-1 på fat før 18",
    familyFriendly: false, trending: true,
    tags: ["rooftop", "date spot", "afterwork", "havn"],
    description: "Stemningsfull utebar midt på Bryggen med string lights, lange trebenker og utsikt mot Vågen. Alltid en god grunn til å bli sittende.",
    hours: "12:00 – 01:00",
    area: "Bryggen",
    lat: 60.3978, lng: 5.3221,
  },
  {
    id: "bergen-rooftop",
    name: "Bergen Rooftop",
    image: rooftop,
    category: "Rooftop",
    rating: 4.8, reviews: 1204,
    priceLevel: 3,
    sunScore: 98, sunStatus: "sun-now", sunUntil: "21:10",
    familyFriendly: false, trending: true,
    tags: ["rooftop", "date spot", "utsikt", "cocktails"],
    description: "Bergens høyeste tak. 360° panorama over fjorden og fjellene — et must i solnedgang.",
    hours: "15:00 – 02:00",
    area: "Sentrum",
    lat: 60.3920, lng: 5.3245,
  },
  {
    id: "fisketorget",
    name: "Fisketorget Terrasse",
    image: fisketorget,
    category: "Restaurant & bar",
    rating: 4.5, reviews: 612,
    priceLevel: 3,
    sunScore: 88, sunStatus: "sun-now", sunUntil: "18:20",
    familyFriendly: true,
    tags: ["sjømat", "havn", "lunsj", "familie"],
    description: "Fersk fisk, kald drikke og solsteik på brygga. Klassisk Bergen-opplevelse.",
    hours: "10:00 – 23:00",
    area: "Torget",
    lat: 60.3935, lng: 5.3234,
  },
  {
    id: "studentbaren",
    name: "Studentbaren",
    image: student,
    category: "Pub",
    rating: 4.3, reviews: 421,
    priceLevel: 1,
    sunScore: 10, sunStatus: "shade",
    dealText: "Pils 49,- hele kvelden",
    familyFriendly: false,
    tags: ["billig", "student", "chill", "quiz"],
    description: "Bergens billigste pils, alltid full på torsdager. Quiz tirsdag og fredag.",
    hours: "16:00 – 03:00",
    area: "Nygård",
    lat: 60.3856, lng: 5.3304,
  },
  {
    id: "nordnes-utebar",
    name: "Nordnes Utebar",
    image: nordnes,
    category: "Utebar",
    rating: 4.6, reviews: 538,
    priceLevel: 2,
    sunScore: 78, sunStatus: "evening-sun", sunUntil: "22:00",
    familyFriendly: true, trending: true,
    tags: ["sjøen", "kveldssol", "chill", "familie"],
    description: "Solnedgang over fjorden, varme tepper og et glass naturvin. Bergens hyggeligste sommerkrok.",
    hours: "13:00 – 00:00",
    area: "Nordnes",
    lat: 60.3997, lng: 5.3107,
  },
  {
    id: "torgallmenningen-pub",
    name: "Torgallmenningen Pub",
    image: pizza,
    category: "Pub & restaurant",
    rating: 4.2, reviews: 389,
    priceLevel: 2,
    sunScore: 55, sunStatus: "shade-soon", sunUntil: "16:30",
    dealText: "Happy hour 16–18",
    familyFriendly: true,
    tags: ["pizza", "familie", "afterwork", "sentrum"],
    description: "Romslig terrasse midt i sentrum. God pizza, sportskanaler og barnemeny.",
    hours: "11:00 – 01:00",
    area: "Torgallmenningen",
    lat: 60.3914, lng: 5.3245,
  },
  {
    id: "marg-bein",
    name: "Marg & Bein",
    image: wine,
    category: "Vinbar",
    rating: 4.9, reviews: 287,
    priceLevel: 3,
    sunScore: 0, sunStatus: "shade",
    familyFriendly: false, trending: true,
    tags: ["date spot", "naturvin", "intimt", "kveld"],
    description: "Intim vinbar med kuratert naturvin-kart og småretter til deling. Perfekt for date.",
    hours: "17:00 – 01:00",
    area: "Skostredet",
    lat: 60.3902, lng: 5.3267,
  },
  {
    id: "7-fjell",
    name: "7 Fjell Bryggeri",
    image: brewery,
    category: "Bryggeri",
    rating: 4.6, reviews: 654,
    priceLevel: 2,
    sunScore: 30, sunStatus: "shade",
    dealText: "Smaking 199,-",
    familyFriendly: false,
    tags: ["craft beer", "smaking", "lokalt", "industrielt"],
    description: "Bergens elskede mikrobryggeri. 16 taps, varierende sesongbrygg og pizza fra naboen.",
    hours: "15:00 – 00:00",
    area: "Sandviken",
    lat: 60.4054, lng: 5.3182,
  },
  {
    id: "kaffemisjonen",
    name: "Kaffemisjonen",
    image: coffee,
    category: "Kaffebar",
    rating: 4.8, reviews: 921,
    priceLevel: 1,
    sunScore: 65, sunStatus: "sun-now", sunUntil: "14:00",
    familyFriendly: true,
    tags: ["kaffe", "frokost", "familie", "remote work"],
    description: "Spesialkaffe, hjemmebakt og rolig stemning. Lyse vinduer og plass til både laptop og barnevogn.",
    hours: "07:30 – 18:00",
    area: "Øvre Korskirkeallm.",
    lat: 60.3938, lng: 5.3286,
  },
  {
    id: "floyen-cafe",
    name: "Fløyen Folkerestaurant",
    image: floyen,
    category: "Restaurant",
    rating: 4.4, reviews: 1873,
    priceLevel: 3,
    sunScore: 95, sunStatus: "sun-now", sunUntil: "20:50",
    familyFriendly: true,
    tags: ["utsikt", "familie", "tur", "lunsj"],
    description: "På toppen av Fløyen — uslåelig utsikt over hele Bergen. Familievennlig med lekeplass.",
    hours: "10:00 – 22:00",
    area: "Fløyen",
    lat: 60.3997, lng: 5.3326,
  },
  {
    id: "no-stress",
    name: "No Stress Cocktail Bar",
    image: cocktail,
    category: "Cocktailbar",
    rating: 4.9, reviews: 512,
    priceLevel: 4,
    sunScore: 0, sunStatus: "shade",
    familyFriendly: false, trending: true,
    tags: ["cocktails", "date spot", "sent", "premium"],
    description: "Mørk, moody cocktailbar med signaturdrinker og vinyl på platespiller. Ingen stress, bare vibes.",
    hours: "19:00 – 03:00",
    area: "Skostredet",
    lat: 60.3897, lng: 5.3271,
  },
  {
    id: "villa-blanca",
    name: "Villa Blanca",
    image: family,
    category: "Hagecafé",
    rating: 4.5, reviews: 334,
    priceLevel: 2,
    sunScore: 82, sunStatus: "sun-now", sunUntil: "17:30",
    dealText: "Familielørdag: barn spiser gratis",
    familyFriendly: true,
    tags: ["hage", "familie", "lunsj", "kake"],
    description: "Skjult hage med store trær, lekeplass og hjemmelagde kaker. Bergens søteste familieflukt.",
    hours: "09:00 – 20:00",
    area: "Møhlenpris",
    lat: 60.3814, lng: 5.3198,
  },
];

export const sectionConfig = [
  { id: "best-now", title: "Best akkurat nå", subtitle: "Topp picks i Bergen i kveld", filter: (v: Venue) => v.rating >= 4.6 },
  { id: "sun-now", title: "Sol nå ☀️", subtitle: "Sitt ute mens sola er fremme", filter: (v: Venue) => v.sunStatus === "sun-now" },
  { id: "cheap-beer", title: "Billig øl 🍺", subtitle: "Under 80,- pils", filter: (v: Venue) => v.priceLevel === 1 || /billig|øl|pils/i.test(v.dealText || "") },
  { id: "trending", title: "Populært i Bergen", subtitle: "Det alle snakker om", filter: (v: Venue) => v.trending === true },
  { id: "family", title: "Familievennlig", subtitle: "Alle aldre velkommen", filter: (v: Venue) => v.familyFriendly },
  { id: "evening-sun", title: "Kveldssol senere", subtitle: "Sol etter 19:00", filter: (v: Venue) => v.sunStatus === "evening-sun" || (v.sunUntil && parseInt(v.sunUntil) >= 19) },
] as const;
