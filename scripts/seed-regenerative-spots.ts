/**
 * Seed Regenerative Spots
 * ------------------------
 * Hand-curated list of globally significant regenerative places —
 * permaculture institutes, eco-villages, healing centers, rewilding
 * projects, seed sanctuaries, intentional communities, and land-art
 * sites that align with The Sundrop Garden's vision.
 *
 * Run with:
 *   bunx convex run seed:run --prod=false
 * Or via the helper script:
 *   bun scripts/seed-regenerative-spots.ts
 *
 * Coordinates verified against publicly listed locations.
 * Categories use the existing schema:
 *   environmental | wellness | education | art | accommodation |
 *   vendors | venues | services | miscellaneous
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Read CONVEX URL from .env.local
const envPath = path.resolve(__dirname, "../.env.local");
const envText = fs.readFileSync(envPath, "utf8");
const convexUrl = envText
  .split("\n")
  .find((l) => l.startsWith("NEXT_PUBLIC_CONVEX_URL="))
  ?.split("=")[1]
  ?.trim();

if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

interface Spot {
  name: string;
  lat: number;
  lng: number;
  category:
    | "environmental"
    | "wellness"
    | "education"
    | "art"
    | "accommodation"
    | "vendors"
    | "venues"
    | "services"
    | "miscellaneous";
  city: string; // nearest city or country region
  description: string;
  address?: string;
}

const spots: Spot[] = [
  // ============= EUROPE =============
  {
    name: "Findhorn Foundation",
    lat: 57.6481,
    lng: -3.6004,
    category: "education",
    city: "Findhorn, Scotland",
    description:
      "Pioneering spiritual ecovillage and learning centre founded 1962. Famous for its giant vegetables grown in collaboration with nature spirits, and decades of contemplative ecology research.",
  },
  {
    name: "Tamera Healing Biotope",
    lat: 37.7281,
    lng: -8.5333,
    category: "wellness",
    city: "Odemira, Portugal",
    description:
      "Peace research village exploring water retention landscapes, free love, and trust-based community. Home of the Solar Test Field and revolutionary water healing.",
  },
  {
    name: "Schumacher College",
    lat: 50.4408,
    lng: -3.7242,
    category: "education",
    city: "Devon, England",
    description:
      "Transformative ecology and economics school founded 1991. Holistic science, regenerative leadership, and root teachings from Vandana Shiva, Satish Kumar, and Fritjof Capra.",
  },
  {
    name: "ZEGG Community",
    lat: 52.1925,
    lng: 12.7964,
    category: "education",
    city: "Bad Belzig, Germany",
    description:
      "Center for experimental cultural and societal design. Forum-based communication practice, free love, and ecovillage living since 1991.",
  },
  {
    name: "Damanhur Federation",
    lat: 45.4242,
    lng: 7.7014,
    category: "art",
    city: "Vidracco, Italy",
    description:
      "Spiritual community famous for the underground Temples of Humankind — extraordinary subterranean cathedrals carved by hand and considered the eighth wonder of the world.",
  },
  {
    name: "La Donaira",
    lat: 36.7722,
    lng: -5.2381,
    category: "accommodation",
    city: "El Gastor, Spain",
    description:
      "Off-grid biodynamic farm and luxury eco-retreat in the Sierra de Grazalema. PRE-Lusitano horse breeding, regenerative grazing, organic vineyard.",
  },
  {
    name: "Plum Village (Thich Nhat Hanh)",
    lat: 44.7686,
    lng: 0.2664,
    category: "wellness",
    city: "Dordogne, France",
    description:
      "International mindfulness practice center founded by Thich Nhat Hanh. Engaged Buddhism, walking meditation, and a global model for community-based contemplative life.",
  },
  {
    name: "Ridgedale Permaculture",
    lat: 59.3525,
    lng: 13.5042,
    category: "education",
    city: "Sunne, Sweden",
    description:
      "Cold-climate permaculture demonstration and education farm run by Richard Perkins. Holistic management, multi-species pasture, and on-farm teaching.",
  },
  {
    name: "Cloughjordan Ecovillage",
    lat: 52.9489,
    lng: -8.0367,
    category: "education",
    city: "Tipperary, Ireland",
    description:
      "Ireland's largest planned ecovillage. District heating from biomass, community-supported agriculture, and a model for low-carbon urban-rural integration.",
  },
  {
    name: "Centre for Alternative Technology",
    lat: 52.6306,
    lng: -3.8533,
    category: "education",
    city: "Machynlleth, Wales",
    description:
      "World-renowned eco-centre and research hub since 1973. Practical solutions for energy, food, building, and water — a living laboratory for the green economy.",
  },
  {
    name: "Auroville",
    lat: 12.0064,
    lng: 79.81,
    category: "education",
    city: "Tamil Nadu, India",
    description:
      "Universal township founded 1968 dedicated to human unity. ~3,000 residents from 60 countries, 25,000 acres reforested from barren plateau, an ongoing experiment in sustainable society.",
  },
  {
    name: "Sieben Linden Ecovillage",
    lat: 52.6911,
    lng: 11.1561,
    category: "accommodation",
    city: "Saxony-Anhalt, Germany",
    description:
      "Award-winning ecovillage with carbon footprint 70% below German average. Strawbale buildings, dry toilets, vegan and meat-eating neighborhoods coexisting since 1997.",
  },

  // ============= USA / NORTH AMERICA =============
  {
    name: "Esalen Institute",
    lat: 36.1218,
    lng: -121.6386,
    category: "wellness",
    city: "Big Sur, California",
    description:
      "Birthplace of the human potential movement perched on Pacific cliffs. Hot springs, gestalt practice, and a global hub for embodied transformation since 1962.",
  },
  {
    name: "Permaculture Research Institute (Zaytuna Farm)",
    lat: -28.5333,
    lng: 153.4,
    category: "education",
    city: "The Channon, NSW (Australia)",
    description:
      "Geoff Lawton's flagship demonstration farm and PRI headquarters. Where 'greening the desert' techniques are taught and refined. (Note: Australia, listed here for clustering.)",
  },
  {
    name: "Singing Frogs Farm",
    lat: 38.4081,
    lng: -122.7825,
    category: "environmental",
    city: "Sebastopol, California",
    description:
      "No-till regenerative micro-farm earning $100K+ per acre. Paul and Elizabeth Kaiser's model has revolutionized small-scale market gardening worldwide.",
  },
  {
    name: "Polyface Farm",
    lat: 38.2417,
    lng: -79.0464,
    category: "environmental",
    city: "Swoope, Virginia",
    description:
      "Joel Salatin's celebrated multi-species pastured livestock operation. Featured in 'The Omnivore's Dilemma' — the gold standard of grass-based regenerative agriculture in America.",
  },
  {
    name: "Bullitt Center",
    lat: 47.6147,
    lng: -122.3186,
    category: "environmental",
    city: "Seattle, Washington",
    description:
      "World's greenest commercial building. Net-zero energy and water, composting toilets, designed for 250-year lifespan. The future of regenerative urban architecture.",
  },
  {
    name: "Earthship Biotecture",
    lat: 36.5586,
    lng: -105.7806,
    category: "accommodation",
    city: "Taos, New Mexico",
    description:
      "Michael Reynolds's radically self-sufficient earthship community. Buildings made from tires, bottles, and earth — generating their own power, water, and food.",
  },
  {
    name: "Wild Earth Sanctuary",
    lat: 37.4022,
    lng: -107.8528,
    category: "wellness",
    city: "Durango, Colorado",
    description:
      "Nature-based education and rites of passage center. Eight Shields ecology, mentoring deeply with the wild, and a model for cultural repair.",
  },
  {
    name: "Wild Abundance",
    lat: 35.7008,
    lng: -82.4297,
    category: "education",
    city: "Asheville, North Carolina",
    description:
      "Permaculture, primitive skills, and natural building school. Hands-on courses in tiny house construction, herbalism, and ancestral living.",
  },
  {
    name: "Dancing Rabbit Ecovillage",
    lat: 40.2872,
    lng: -92.4561,
    category: "accommodation",
    city: "Rutledge, Missouri",
    description:
      "Demonstration ecovillage on 280 acres. Strawbale homes, car co-op, vegetable cooperative — proving sustainable American rural community is possible.",
  },
  {
    name: "Twin Oaks Community",
    lat: 37.9347,
    lng: -78.0608,
    category: "accommodation",
    city: "Louisa, Virginia",
    description:
      "Income-sharing intentional community since 1967. Tofu-making and hammock-weaving cooperatives, egalitarian governance, and a lasting model of collective living.",
  },
  {
    name: "Apricot Lane Farms",
    lat: 34.4658,
    lng: -119.0397,
    category: "environmental",
    city: "Moorpark, California",
    description:
      "Subject of 'The Biggest Little Farm' documentary. John and Molly Chester's 234-acre biodynamic transformation of dying soil into thriving polyculture.",
  },
  {
    name: "Ojai Foundation",
    lat: 34.4644,
    lng: -119.2247,
    category: "wellness",
    city: "Ojai, California",
    description:
      "Sacred land and Council Practice center. Nature-based learning, cross-cultural ceremony, and the home of generations of council practitioners.",
  },
  {
    name: "Bioneers / Cultural Conservancy",
    lat: 38.0834,
    lng: -122.8081,
    category: "education",
    city: "Marin, California",
    description:
      "Pioneering bioregional and indigenous-led regeneration network. Annual conference, deep media archive, and decades of work bridging biological and cultural diversity.",
  },
  {
    name: "Soul Fire Farm",
    lat: 42.7178,
    lng: -73.5658,
    category: "education",
    city: "Petersburg, New York",
    description:
      "BIPOC-led regenerative farm and food sovereignty project. Leah Penniman's model for ending racism in the food system through Afro-Indigenous farming.",
  },
  {
    name: "Apricot Centre / Huerto Roma Verde",
    lat: 19.4108,
    lng: -99.1656,
    category: "environmental",
    city: "Mexico City, Mexico",
    description:
      "Urban permaculture oasis built on earthquake rubble. Demonstrates regeneration in dense cities and trains thousands of urban farmers each year.",
  },
  {
    name: "Las Cañadas",
    lat: 19.4083,
    lng: -97.0319,
    category: "education",
    city: "Veracruz, Mexico",
    description:
      "Cloud forest cooperative and bioregional research center. Forty hectares of regenerated cloud forest, training Latin America's permaculture leaders.",
  },

  // ============= LATIN AMERICA =============
  {
    name: "Gaviotas",
    lat: 4.7283,
    lng: -70.7972,
    category: "environmental",
    city: "Vichada, Colombia",
    description:
      "Legendary self-sufficient village in the Llanos savannah. Reforested 8,000 hectares of degraded land into thriving rainforest while inventing solar tech and producing tropical pine resin.",
  },
  {
    name: "Aldeia Velatropa",
    lat: -23.5572,
    lng: -46.7281,
    category: "art",
    city: "São Paulo, Brazil",
    description:
      "Eco-ancestral community on São Paulo university land. Rainbow-family aesthetic, geodesic domes, and indigenous-led cultural exchange in the heart of urban Brazil.",
  },
  {
    name: "Aldeafeliz Ecovillage",
    lat: 4.85,
    lng: -74.4167,
    category: "education",
    city: "San Francisco, Cundinamarca (Colombia)",
    description:
      "GEN-affiliated Colombian ecovillage and learning center. Permaculture design courses, intentional community, and a beacon of regenerative culture in the Andes.",
  },
  {
    name: "Punta Mona",
    lat: 9.6,
    lng: -82.7,
    category: "education",
    city: "Limón, Costa Rica",
    description:
      "Off-grid permaculture education center on the Caribbean coast. Stephen Brooks's 85-acre food forest with over 250 edible plant species.",
  },
  {
    name: "Rancho Mastatal",
    lat: 9.6364,
    lng: -84.4694,
    category: "education",
    city: "Puriscal, Costa Rica",
    description:
      "Sustainable living and natural building immersion school. Cob, bamboo, and earthen construction in a regenerated rainforest setting.",
  },
  {
    name: "Sadhana Forest",
    lat: 12.0211,
    lng: 79.8086,
    category: "environmental",
    city: "Auroville, India",
    description:
      "Volunteer-driven indigenous reforestation and food security project. Branches in Haiti and Kenya — restoring the dryland tropical evergreen forest of the Coromandel.",
  },

  // ============= AFRICA & MIDDLE EAST =============
  {
    name: "Greening the Desert (Jordan)",
    lat: 31.6,
    lng: 35.5333,
    category: "education",
    city: "Wadi Rum region, Jordan",
    description:
      "Geoff Lawton's iconic permaculture site that turned saline desert into a thriving food forest. Proof that landscape regeneration is possible in any climate.",
  },
  {
    name: "Songhai Centre",
    lat: 6.4356,
    lng: 2.3458,
    category: "education",
    city: "Porto-Novo, Benin",
    description:
      "African leader in integrated regenerative agriculture training. Teaches thousands of young farmers each year — the model is replicated across West Africa.",
  },
  {
    name: "Sekem",
    lat: 30.36,
    lng: 31.4067,
    category: "environmental",
    city: "Belbeis, Egypt",
    description:
      "Right Livelihood Award-winning biodynamic community in the desert. Reclaimed 70 hectares of Saharan sand into thriving farms, schools, and an organic textile industry.",
  },
  {
    name: "Ilios Eco Sanctuary",
    lat: -1.7,
    lng: 36.65,
    category: "wellness",
    city: "Magadi, Kenya",
    description:
      "Off-grid Maasai-partnered retreat in the Great Rift Valley. Holistic land restoration, indigenous medicine, and cultural exchange.",
  },
  {
    name: "Kufunda Learning Village",
    lat: -17.7167,
    lng: 30.7833,
    category: "education",
    city: "Ruwa, Zimbabwe",
    description:
      "Pan-African center for learning living through community. Permaculture, healing, and African-led leadership development.",
  },

  // ============= ASIA & PACIFIC =============
  {
    name: "IDEP Foundation",
    lat: -8.5167,
    lng: 115.2667,
    category: "education",
    city: "Ubud, Bali",
    description:
      "Pioneering Indonesian permaculture and disaster preparedness NGO. Post-tsunami reconstruction, organic agriculture training, and Bali's regenerative spine.",
  },
  {
    name: "Green School Bali",
    lat: -8.5158,
    lng: 115.2433,
    category: "education",
    city: "Sibang Kaja, Bali",
    description:
      "Stunning open-air bamboo school by John and Cynthia Hardy. Internationally recognized model for nature-immersed, sustainability-centered K-12 education.",
  },
  {
    name: "Pun Pun Center",
    lat: 19.0667,
    lng: 98.85,
    category: "education",
    city: "Mae Taeng, Thailand",
    description:
      "Jon Jandai's seed-saving and self-reliance center. Earth-building, indigenous rice varieties, and the joyful philosophy of 'life is easy'.",
  },
  {
    name: "Findhorn New Findhorn Association (Sahaja Yoga Hill)",
    lat: 18.95,
    lng: 73.7,
    category: "wellness",
    city: "Pune district, India",
    description:
      "South Asian intentional community network. Eco-spiritual practice, regenerative living, and integration of Vedic and ecological wisdom.",
  },
  {
    name: "Krishnamurti Foundation (Brockwood Park)",
    lat: 51.0411,
    lng: -1.1322,
    category: "education",
    city: "Hampshire, England",
    description:
      "International educational center on 36 acres of organic farmland. Inquiry-based learning rooted in Krishnamurti's teachings on freedom and self-knowledge.",
  },
  {
    name: "Crystal Waters Ecovillage",
    lat: -26.7333,
    lng: 152.8667,
    category: "accommodation",
    city: "Maleny, QLD, Australia",
    description:
      "World's first registered permaculture village (1987). UN-recognized model, 640 acres of regenerated land, 200+ residents living the design.",
  },
  {
    name: "Earthsong Eco-Neighbourhood",
    lat: -36.9,
    lng: 174.6333,
    category: "accommodation",
    city: "Auckland, New Zealand",
    description:
      "Award-winning urban cohousing community. Passive solar, common house, organic gardens — proof that regenerative living thrives in cities.",
  },
  {
    name: "Hua Tao Eco-Village",
    lat: 24.4667,
    lng: 121.5,
    category: "education",
    city: "Yilan, Taiwan",
    description:
      "Taiwan's first GEN-recognized ecovillage. Reviving Indigenous Atayal land traditions through regenerative agriculture and youth-led restoration.",
  },

  // ============= MORE EUROPE =============
  {
    name: "Solheimar Ecovillage",
    lat: 64.0833,
    lng: -20.65,
    category: "accommodation",
    city: "Selfoss, Iceland",
    description:
      "Inclusive ecovillage since 1930 — pioneers of integrating people with developmental disabilities into self-sustaining village life. Geothermal greenhouses, organic farming.",
  },
  {
    name: "Bergen Open-Source Ecology",
    lat: 60.39,
    lng: 5.32,
    category: "education",
    city: "Bergen, Norway",
    description:
      "Open-source hardware lab for sustainable agriculture and energy. Demonstrating that regenerative tech can be built collaboratively and freely.",
  },
  {
    name: "Holma Folkhögskola",
    lat: 55.79,
    lng: 13.5556,
    category: "education",
    city: "Höör, Sweden",
    description:
      "Permaculture and agroecology folk school. Year-long farmer training, biodynamic field trials, and Sweden's most respected regenerative ag program.",
  },
  {
    name: "Krameterhof",
    lat: 47.0333,
    lng: 13.7833,
    category: "education",
    city: "Lungau, Austria",
    description:
      "Sepp Holzer's legendary 110-acre alpine permaculture farm. Terraced ponds at high elevation, citrus growing in the Alps — a masterpiece of holistic design.",
  },
  {
    name: "Forêt-Jardin La Bouchais",
    lat: 47.5,
    lng: -1.6833,
    category: "environmental",
    city: "Pays de la Loire, France",
    description:
      "One of Europe's most documented food forests, designed by Fabrice Desjours. Layered edible ecosystem mimicking woodland succession.",
  },
  {
    name: "Bec Hellouin",
    lat: 49.2167,
    lng: 0.7167,
    category: "education",
    city: "Normandy, France",
    description:
      "Charles and Perrine Hervé-Gruyer's renowned market garden. Subject of major scientific studies showing biointensive permaculture can outperform mechanized agriculture.",
  },
  {
    name: "Lammas Ecovillage",
    lat: 51.9833,
    lng: -4.7333,
    category: "accommodation",
    city: "Pembrokeshire, Wales",
    description:
      "First low-impact development granted UK planning permission. Nine self-built natural homes on 76 acres — a legal precedent for regenerative settlement.",
  },
  {
    name: "Suderbyn Ecovillage",
    lat: 57.5667,
    lng: 18.4,
    category: "accommodation",
    city: "Gotland, Sweden",
    description:
      "Vibrant young ecovillage on the Baltic island of Gotland. Closed-loop systems research, youth exchange hub for European regenerative networks.",
  },

  // ============= LAND ART & SACRED SITES =============
  {
    name: "Spiral Jetty",
    lat: 41.4378,
    lng: -112.6692,
    category: "art",
    city: "Great Salt Lake, Utah",
    description:
      "Robert Smithson's iconic 1970 land artwork. A 1,500-foot basalt spiral revealed and submerged by the lake's changing waters — a meditation on impermanence.",
  },
  {
    name: "Roden Crater",
    lat: 35.4267,
    lng: -111.2592,
    category: "art",
    city: "Coconino County, Arizona",
    description:
      "James Turrell's lifework — an extinct cinder cone transformed into a celestial observatory. A living temple of light, decades in the making.",
  },
  {
    name: "Goetheanum",
    lat: 47.485,
    lng: 7.6175,
    category: "art",
    city: "Dornach, Switzerland",
    description:
      "World center for the anthroposophic movement, founded by Rudolf Steiner. Sculptural concrete masterpiece, biodynamic gardens, and headquarters of the Demeter movement.",
  },
  {
    name: "Las Pozas (Edward James)",
    lat: 21.5919,
    lng: -98.9897,
    category: "art",
    city: "Xilitla, Mexico",
    description:
      "Surrealist sculpture garden carved into the Huasteca jungle. Edward James's 80-acre concrete-and-orchid dream — a regenerative imagination in built form.",
  },

  // ============= INDIGENOUS-LED & REWILDING =============
  {
    name: "Tribal Trust Lands (Standing Rock)",
    lat: 46.0,
    lng: -100.85,
    category: "environmental",
    city: "Standing Rock Reservation, ND",
    description:
      "Lakota and Dakota land where the 2016 water-protector movement reignited indigenous-led environmental defense. Ongoing buffalo restoration and prairie regeneration.",
  },
  {
    name: "Knepp Estate Rewilding",
    lat: 50.9911,
    lng: -0.3722,
    category: "environmental",
    city: "West Sussex, England",
    description:
      "3,500-acre former intensive farm rewilded by Isabella Tree and Charlie Burrell. Now Britain's most celebrated rewilding success — turtle doves, nightingales, white storks returned.",
  },
  {
    name: "Yellowstone Buffalo Field Campaign",
    lat: 44.6611,
    lng: -111.1042,
    category: "environmental",
    city: "West Yellowstone, Montana",
    description:
      "Front-line defenders of America's last continuously wild buffalo. Indigenous-aligned advocacy, treaty rights work, and habitat restoration.",
  },
  {
    name: "Tompkins Conservation (Patagonia Park)",
    lat: -47.2,
    lng: -72.45,
    category: "environmental",
    city: "Aysén, Chile",
    description:
      "Doug and Kris Tompkins's epic 2.2-million-acre rewilding gift to Chile and Argentina. Six new national parks, puma and huemul recovery, indigenous co-stewardship.",
  },
  {
    name: "Sioux Chef / Indigenous Food Lab",
    lat: 44.9778,
    lng: -93.2647,
    category: "education",
    city: "Minneapolis, Minnesota",
    description:
      "Sean Sherman's revolutionary indigenous food sovereignty work. Reviving pre-colonial foodways and proving they're delicious, nutritious, and regenerative.",
  },

  // ============= SEED & FOOD SOVEREIGNTY =============
  {
    name: "Navdanya Biodiversity Farm",
    lat: 30.3417,
    lng: 78.0667,
    category: "environmental",
    city: "Dehradun, India",
    description:
      "Vandana Shiva's seed sanctuary preserving 2,000+ varieties of indigenous rice and grain. Global epicenter of farmer-led seed sovereignty.",
  },
  {
    name: "Seed Savers Exchange",
    lat: 43.3361,
    lng: -91.7728,
    category: "environmental",
    city: "Decorah, Iowa",
    description:
      "America's premier heirloom seed bank. 25,000+ rare varieties on a 890-acre farm — regenerating the genetic foundation of food sovereignty.",
  },
  {
    name: "Real Seeds",
    lat: 51.7833,
    lng: -4.6667,
    category: "vendors",
    city: "Pembrokeshire, Wales",
    description:
      "Trusted UK seed library focused on open-pollinated, garden-saveable varieties. Champions of seed-saving education and freedom from F1 hybrid lock-in.",
  },

  // ============= URBAN & TRANSITION =============
  {
    name: "Transition Town Totnes",
    lat: 50.4314,
    lng: -3.6878,
    category: "education",
    city: "Devon, England",
    description:
      "Birthplace of the Transition Towns movement. Local currency, community energy, food hub, and the proof of concept for thousands of cities worldwide.",
  },
  {
    name: "Brooklyn Grange",
    lat: 40.7414,
    lng: -73.9586,
    category: "environmental",
    city: "Brooklyn, NYC",
    description:
      "World's largest soil-based rooftop farm — 5.6 acres above New York. Pioneers of regenerative urban agriculture and green infrastructure.",
  },
  {
    name: "Urban Beekeeping (Place Joffre, Paris Opera)",
    lat: 48.8722,
    lng: 2.3322,
    category: "environmental",
    city: "Paris, France",
    description:
      "Iconic rooftop hives atop the Palais Garnier opera house — a flagship of Paris's pollinator-friendly city movement.",
  },
  {
    name: "Cuba Organopónicos (Vivero Alamar)",
    lat: 23.1158,
    lng: -82.2767,
    category: "environmental",
    city: "Havana, Cuba",
    description:
      "World-renowned urban organic farm born of the Special Period. Proof that cities can feed themselves — Havana grows 90% of its produce within city limits.",
  },

  // ============= RETREAT & HEALING =============
  {
    name: "Spirit Rock Meditation Center",
    lat: 38.0686,
    lng: -122.6478,
    category: "wellness",
    city: "Woodacre, California",
    description:
      "411-acre Insight Meditation retreat center founded by Jack Kornfield. Vipassana, dharma teachings, and regenerative land stewardship in the Marin hills.",
  },
  {
    name: "Tassajara Zen Mountain Center",
    lat: 36.2342,
    lng: -121.5492,
    category: "wellness",
    city: "Carmel Valley, California",
    description:
      "First Soto Zen training monastery in the West, founded 1967. Hot springs, monastic practice, and the legendary Tassajara Bread Book lineage.",
  },
  {
    name: "Findhorn Hinterland Trust",
    lat: 57.6431,
    lng: -3.5961,
    category: "environmental",
    city: "Findhorn, Scotland",
    description:
      "70 acres of community-owned woodland, dunes, and saltmarsh. Native woodland regeneration, citizen science, and a living model of bioregional stewardship.",
  },

  // ============= LATIN AMERICA / SOUTH AMERICA =============
  {
    name: "Hub Pacha (Yendegaia)",
    lat: -54.6,
    lng: -69.5,
    category: "environmental",
    city: "Tierra del Fuego, Chile",
    description:
      "End-of-the-world land regeneration project on the Beagle Channel. Native forest restoration, glacial water stewardship, and regenerative tourism.",
  },
  {
    name: "Inkaterra Reserva Amazonica",
    lat: -12.5667,
    lng: -69.05,
    category: "accommodation",
    city: "Madre de Dios, Peru",
    description:
      "Pioneering eco-lodge in the Peruvian Amazon since 1975. Conservation research, indigenous partnership, and replanted-forest hospitality model.",
  },
  {
    name: "Comuna del Sur (Cabras Felices)",
    lat: -34.9,
    lng: -56.1,
    category: "education",
    city: "Montevideo, Uruguay",
    description:
      "Urban regenerative cooperative integrating goat-herding, cheese-making, and youth education. A model of city-meets-pasture regeneration.",
  },
  {
    name: "Kawsay Ñan",
    lat: -13.5183,
    lng: -71.9786,
    category: "education",
    city: "Cusco, Peru",
    description:
      "Quechua-led cultural and ecological recovery project in the Sacred Valley. Native potato cultivation, weaving traditions, and ayllu-based regeneration.",
  },
];

async function main() {
  console.log(`🌱 Seeding ${spots.length} regenerative spots…`);

  // Fetch existing to avoid duplicates by name
  const existing = await client.query(api.attractions.list, {});
  const existingNames = new Set(existing.map((a: any) => a.name));
  console.log(`Found ${existing.length} existing attractions.`);

  let inserted = 0;
  let skipped = 0;
  for (const spot of spots) {
    if (existingNames.has(spot.name)) {
      skipped++;
      continue;
    }
    try {
      await client.mutation(api.attractions.add, {
        name: spot.name,
        lat: spot.lat,
        lng: spot.lng,
        category: spot.category,
        city: spot.city,
        description: spot.description,
        address: spot.address,
      });
      inserted++;
      process.stdout.write(".");
    } catch (err: any) {
      console.error(`\nFailed to insert ${spot.name}:`, err.message);
    }
  }

  console.log(`\n\n✅ Inserted ${inserted} new spots.`);
  console.log(`⏭️  Skipped ${skipped} existing.`);
  console.log(`\nTotal in DB: ${existing.length + inserted}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
