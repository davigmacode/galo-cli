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
  summary: string;
  duplicateTolerance: number;
  startAt: number;
  shuffle: boolean | GenerationShuffle;
  threads: GenerationThread[];
}

interface GenerationShuffle {
  enabled: boolean;
  fromId: number;
  toId: number;
}

interface GenerationOrder {
  name: string;
  includes?: string[];
  excludes?: string[];
}

interface GenerationThread {
  size: number;
  order: string[] | GenerationOrder[];
  dna?: string[];
}

interface BuildArtworkConfig {
  basePath: string;
  trait: TraitConfig;
  artwork: ArtworksConfig;
}

interface BuildCollageConfig {
  basePath: string;
  generation: Gen[];
  artworks: ArtworksConfig;
  collage: CollageConfig;
}

interface TraitConfig {
  path: string;
  attributes: GenAttr[];
  options: any;
}

interface TraitsConfig {
  path: string;
  summary: string;
  rarity: string;
  exts: string;
  delimiter: string;
  options: any;
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

interface MetadataConfig {
  path: string;
  summary: string;
  template: string | object;
}

interface DistributionConfig {
  path: string;
  order: string;
  resetId: boolean;
  outputs: DistributionOutput[];
}

interface DistributionOutput {
  path: string;
  count?: number;
  default?: boolean;
  resetIdFrom?: number;
}

interface TaskConfig {
  processText: string;
  successText: string;
  delay?: number;
  fn: (spinner: any) => Promise<any>;
}

interface EngineConfig {
  name: string;
  description: string;
  version: number;
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

interface StorageConfig {
  [key]: StorageItem;
}

interface StorageItem {
  label: string;
  cache: string;
  token: string;
}

interface BaseConfig {
  config: string;
}

interface GaloConfig {
  engine: EngineConfig;
  traits: TraitsConfig;
  metadata: MetadataConfig;
  artworks: ArtworksConfig;
  collage: CollageConfig;
  generation: GenerationConfig;
  distribution: DistributionConfig;
  storage: StorageConfig;
  base?: BaseConfig;
}