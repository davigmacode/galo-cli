interface Gen {
  dna: string;
  edition: number;
  image: string;
  attributes: GenAttr[];
}

interface GenAttr {
  trait: string;
  value: string;
  image: string;
  path: string;
  opacity: number;
  blend: 'saturate' | 'clear' | 'copy' | 'destination' | 'source-over' | 'destination-over' |
  'source-in' | 'destination-in' | 'source-out' | 'destination-out' | 'source-atop' | 'destination-atop' |
  'xor' | 'lighter' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' |
  'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
}

interface TraitType {
  label: string;
  description: string;
  opacity: number;
  blend: 'saturate' | 'clear' | 'copy' | 'destination' | 'source-over' | 'destination-over' |
  'source-in' | 'destination-in' | 'source-out' | 'destination-out' | 'source-atop' | 'destination-atop' |
  'xor' | 'lighter' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' |
  'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
  items: TraitItem[];
}

interface TraitItem {
  label: string;
  description: string;
  rarity: string | number;
}

interface Traits {
  [index: string]: TraitType;
}

interface GenerationOrder {
  name: string;
  includes: string[];
  excludes: string[];
}

interface Generation {
  size: number;
  order: string[] | GenerationOrder[];
}

interface BuildArtworksConfig {
  path: string | string[];
  edition: number;
  attributes: GenAttr[];
  width: number;
  height: number;
  minify: boolean;
  quality: "fast" | "good" | "best" | "nearest" | "bilinear";
}

interface BuildCollageConfig {
  basePath: string | string[];
  artworksPath: string | string[];
  previewPath: string | string[];
  generations: Gen[];
  thumbWidth: number;
  thumbPerRow: number;
  imageRatio: number;
}

interface TaskConfig {
  processText: string;
  successText: string;
  delay?: number;
  fn: () => Promise<any>;
}

interface Rarity {
  [key: string]: RarityTier
}

interface RarityTier {
  label: string;
  weight: number;
  default: boolean;
}