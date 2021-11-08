interface Gen {
  dna: string;
  edition: number;
  image: string;
  attributes: GenAttr[];
}

interface GenAttr {
  traitType: TraitType;
  traitItem: TraitItem;
}

interface TraitType {
  name?: string;
  label?: string;
  description?: string;
  opacity?: number;
  blend?: 'clear' | 'source' | 'over' | 'in' | 'out' | 'atop' | 'dest' | 'dest-over' | 'dest-in' | 'dest-out' | 'dest-atop' | 'xor' | 'add' | 'saturate' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'colour-dodge' | 'colour-dodge' | 'colour-burn' | 'colour-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';
  path?: string;
  items?: TraitItem[];
}

interface TraitItem extends TraitType {
  file?: string;
  ext?: string;
  rarity?: string | number;
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
  dna: string[];
}

interface BuildArtworksConfig {
  trait: {
    path: string;
    width: number;
    height: number;
    attributes: GenAttr[];
  };
  artwork: {
    path: string;
    ext: string;
    width: number;
    height: number;
    minify: boolean;
    quality: "fast" | "good" | "best" | "nearest" | "bilinear";
  };
}

interface BuildCollageConfig {
  basePath: string;
  artworksPath: string | string[];
  previewPath: string | string[];
  generations: Gen[];
  editions: number;
  thumbWidth: number;
  thumbPerRow: number;
  imageRatio: number;
}

interface TaskConfig {
  processText: string;
  successText: string;
  delay?: number;
  fn: (spinner: any) => Promise<any>;
}

interface Rarity {
  [key: string]: RarityTier
}

interface RarityTier {
  label: string;
  weight: number;
  default: boolean;
}

interface UploadsConfig {
  basePath: string;
  configPath: string;
  config: any;
  provider: string;
  generations: any;
}