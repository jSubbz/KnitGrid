export interface PatternListing {
  id: string;
  title: string;
  designer: string;
  price: number;
  rating: number;
  tags: string[];
  category: string;
  description: string;
  featured?: boolean;
  topToday?: boolean;
}

export const patternListings: PatternListing[] = [
  {
    id: "nordic-snowline",
    title: "Nordic Snowline",
    designer: "Studio Rowan",
    price: 8,
    rating: 4.8,
    tags: ["colorwork", "winter", "repeat"],
    category: "Sweater",
    description: "Graphic winter colorwork motif with strong horizontal repeats.",
    featured: true,
    topToday: true,
  },
  {
    id: "mountain-fade-mittens",
    title: "Mountain Fade Mittens",
    designer: "Aster Wool",
    price: 6,
    rating: 4.6,
    tags: ["mittens", "small chart", "fade"],
    category: "Accessories",
    description: "Compact mitten chart with simple repeat blocks and clean shaping.",
    featured: true,
    topToday: true,
  },
  {
    id: "forest-trail-yoke",
    title: "Forest Trail Yoke",
    designer: "Pine Loop",
    price: 10,
    rating: 4.9,
    tags: ["yoke", "sweater", "woodland"],
    category: "Sweater",
    description: "Round-yoke chart with repeating woodland bands and contrast motifs.",
    featured: true,
    topToday: true,
  },
  {
    id: "harbor-check-beanie",
    title: "Harbor Check Beanie",
    designer: "Dockside Knits",
    price: 5,
    rating: 4.4,
    tags: ["beanie", "check", "beginner"],
    category: "Hat",
    description: "Simple check-based beanie chart with clean vertical repeats.",
    topToday: true,
  },
  {
    id: "ember-cuff-chart",
    title: "Ember Cuff Chart",
    designer: "Red Fern Fiber",
    price: 4,
    rating: 4.5,
    tags: ["cuff", "small repeat", "gift"],
    category: "Accessories",
    description: "Small repeat chart intended for cuffs, wrist warmers, and trims.",
  },
  {
    id: "fjord-band-pullover",
    title: "Fjord Band Pullover",
    designer: "North Loom",
    price: 12,
    rating: 4.7,
    tags: ["pullover", "bands", "colorwork"],
    category: "Sweater",
    description: "Pullover chart pack with stacked horizontal motif bands.",
  },
  {
    id: "heather-grid-socks",
    title: "Heather Grid Socks",
    designer: "Moss & Needle",
    price: 7,
    rating: 4.3,
    tags: ["socks", "grid", "repeat"],
    category: "Socks",
    description: "Sock chart with tidy repeat structure for smaller circumferences.",
    topToday: true,
  },
  {
    id: "oak-leaf-cowl",
    title: "Oak Leaf Cowl",
    designer: "Fernmere",
    price: 6,
    rating: 4.7,
    tags: ["cowl", "leaf", "motif"],
    category: "Cowl",
    description: "Leaf-based cowl chart with mirrored motif structure.",
  },
];