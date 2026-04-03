import { createEmptyProject } from "../project/projectFactory";
import type { KnitProject, PatternSymbol } from "../project/types";

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

function paintCell(
  project: KnitProject,
  r: number,
  c: number,
  symbol: PatternSymbol
) {
  if (r < 0 || r >= project.rows || c < 0 || c >= project.cols) return;
  project.pattern[r][c] = { symbol };
}

function paintMatrix(
  project: KnitProject,
  startRow: number,
  startCol: number,
  matrix: PatternSymbol[][]
) {
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix[r].length; c += 1) {
      paintCell(project, startRow + r, startCol + c, matrix[r][c]);
    }
  }
}

function motifForPattern(id: string): PatternSymbol[][] {
  switch (id) {
    case "nordic-snowline":
      return [
        ["dot", "empty", "dot", "empty"],
        ["empty", "dot", "empty", "dot"],
        ["dot", "h", "dot", "h"],
        ["empty", "dot", "empty", "dot"],
      ];

    case "mountain-fade-mittens":
      return [
        ["diagFwd", "empty", "diagBack", "empty"],
        ["empty", "dot", "empty", "dot"],
        ["diagBack", "empty", "diagFwd", "empty"],
        ["empty", "dot", "empty", "dot"],
      ];

    case "forest-trail-yoke":
      return [
        ["dot", "v", "dot", "v"],
        ["diagFwd", "dot", "diagBack", "dot"],
        ["dot", "h", "dot", "h"],
        ["diagBack", "dot", "diagFwd", "dot"],
      ];

    case "harbor-check-beanie":
      return [
        ["dot", "dot", "empty", "empty"],
        ["dot", "dot", "empty", "empty"],
        ["empty", "empty", "dot", "dot"],
        ["empty", "empty", "dot", "dot"],
      ];

    case "ember-cuff-chart":
      return [
        ["dot", "empty", "dot", "empty"],
        ["h", "dot", "h", "dot"],
        ["dot", "empty", "dot", "empty"],
        ["h", "dot", "h", "dot"],
      ];

    case "fjord-band-pullover":
      return [
        ["h", "dot", "h", "dot"],
        ["dot", "empty", "dot", "empty"],
        ["h", "dot", "h", "dot"],
        ["dot", "empty", "dot", "empty"],
      ];

    case "heather-grid-socks":
      return [
        ["v", "empty", "v", "empty"],
        ["empty", "dot", "empty", "dot"],
        ["v", "empty", "v", "empty"],
        ["empty", "dot", "empty", "dot"],
      ];

    case "oak-leaf-cowl":
      return [
        ["empty", "dot", "dot", "empty"],
        ["dot", "diagFwd", "diagBack", "dot"],
        ["dot", "h", "h", "dot"],
        ["empty", "dot", "dot", "empty"],
      ];

    default:
      return [
        ["dot", "empty", "dot", "empty"],
        ["empty", "dot", "empty", "dot"],
        ["dot", "empty", "dot", "empty"],
        ["empty", "dot", "empty", "dot"],
      ];
  }
}

export function buildProjectFromPattern(pattern: PatternListing): KnitProject {
  const project = createEmptyProject(24, 24);

  project.yarn.yarnName = pattern.title;
  project.yarn.yarnDescriptors = pattern.designer;
  project.yarn.patternTags = pattern.tags.join(", ");
  project.confirmedShape = true;

  const motif = motifForPattern(pattern.id);
  const motifRows = motif.length;
  const motifCols = motif[0]?.length ?? 0;

  const startRow = project.rows - motifRows;
  const startCol = project.cols - motifCols;

  paintMatrix(project, startRow, startCol, motif);

  project.cursor = { r: startRow, c: startCol };
  project.selectedRow = startRow;

  project.tileSource = {
    ...project.tileSource,
    originR: startRow,
    originC: startCol,
    tileRows: motifRows,
    tileCols: motifCols,
    confirmed: true,
  };

  return project;
}