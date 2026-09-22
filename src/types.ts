export type AssetPart = {
  id: string;
  name: string;
  nodeNames: string[];
  description?: string;
  explodeOffset?: [number, number, number];
};

export type AssetRecord = {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  status: 'ready' | 'review' | 'planned';
  description: string;
  modelUrl?: string;
  animation?: { defaultClip: string; duration: number };
  thumbnail?: string;
  source: { label: string; url?: string; license?: string };
  parts: AssetPart[];
  stats?: { meshes: number; triangles: number; materials: number; bytes: number };
  notes?: string[];
};
