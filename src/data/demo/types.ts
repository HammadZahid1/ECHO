import type { GraphData } from '@/types';

export interface DemoDataset {
  id: string;
  name: string;
  description: string;
  accent: string;
  topics: string[];
  create: () => GraphData;
}
