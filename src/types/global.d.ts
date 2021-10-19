interface Gen {
  dna: string;
  edition: number;
  image: string;
  attributes: Attr[];
}

interface Attr {
  trait_type: string;
  value: string;
  path: string;
}

interface Layer {
  caption: string;
  description: string;
  blend: string;
  opacity: number;
  items: LayerItem[];
}

interface LayerItem {
  caption: string;
  description: string;
  weight: number;
}

interface LayerBreakdown {
  [index: string]: Layer;
}

interface GenerationOrder {
  name: string;
}

interface GenerationConfig {
  size: number;
  order: GenerationOrder[];
}
