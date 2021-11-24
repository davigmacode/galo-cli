interface Gen {
  id: number;
  dna: string;
  attributes: GenAttr[];
  artwork?: {
    id?: string;
    uri?: string;
    url?: string;
    type?: string;
  };
  rarity?: {
    score?: number;
    rank?: number;
  };
}

interface GenAttr {
  type: TraitType;
  trait: TraitItem;
  rarity?: TraitRarity;
}

interface TraitType {
  name?: string;
  label?: string;
  description?: string;
  path?: string;
  items?: TraitItem[];
}

interface TraitItem extends TraitType {
  file?: string;
  ext?: string;
  weight?: number;
  rarity?: TraitRarity;
}

interface TraitRarity {
  occurrence?: number;
  chance?: number;
  percentage?: string;
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
    scale: any;
    attributes: GenAttr[];
  };
  artwork: {
    path: string;
    ext: string;
    width: number;
    height: number;
    background: any;
    transparent: boolean;
    option: any;
  };
}

interface BuildCollageConfig {
  basePath: string;
  generation: Gen[];
  artworks: ArtworksConfig;
  collage: CollageConfig;
}

interface ArtworksConfig {
  path: string;
  ext: string;
  width: number;
  height: number;
  options: any;
};

interface CollageConfig {
  name: string;
  order: string;
  limit: number;
  thumbWidth: number;
  thumbPerRow: number;
  options: any;
}

interface TaskConfig {
  processText: string;
  successText: string;
  delay?: number;
  fn: (spinner: any) => Promise<any>;
}

interface UploadsConfig {
  uploadType: string;
  basePath: string;
  configPath: string;
  config: any;
  cachedPath: string;
  cached: any;
  generation: Gen[];
}