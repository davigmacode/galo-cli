interface Gen {
  dna: string;
  edition: number;
  image: string;
  attributes: GenAttr[];
  rarity?: number;
  rank?: number;
}

interface GenAttr {
  traitType: TraitType;
  traitItem: TraitItem;
  traitRarity?: TraitRarity;
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

interface TraitRarity {
  occurrence: number;
  chance: number;
  percentage: string;
}

interface Traits {
  [index: string]: TraitType;
}

interface GenerationConfig {
  config: string,
  duplicateTolerance: number,
  startAt: number,
  threads: GenerationThread[]
}

interface GenerationOrder {
  name: string;
  includes?: string[];
  excludes?: string[];
}

interface GenerationThread {
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
    option: any;
  };
}

interface BuildCollageConfig {
  basePath: string;
  artworksPath: string | string[];
  previewPath: string | string[];
  artworksExt: string;
  generation: Gen[];
  order: string;
  limit: number;
  background: string;
  thumbWidth: number;
  thumbPerRow: number;
  imageRatio: number;
  formatOption: any;
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
  uploadType: string;
  basePath: string;
  configPath: string;
  config: any;
  cachedPath: string;
  cached: any;
  generation: any;
}