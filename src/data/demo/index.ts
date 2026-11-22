import type { GraphData } from '@/types';
import { softwareEngineeringDataset } from './softwareEngineering';
import { artificialIntelligenceDataset } from './artificialIntelligence';
import { astronomyDataset } from './astronomy';
import { philosophyDataset } from './philosophy';
import { scientificResearchDataset } from './scientificResearch';
import { productDevelopmentDataset } from './productDevelopment';
import { learningSystemsDataset } from './learningSystems';
import { roboticsDataset } from './robotics';
import { computerScienceDataset } from './computerScience';
import type { DemoDataset } from './types';

export const DEMO_DATASETS: DemoDataset[] = [
  softwareEngineeringDataset,
  artificialIntelligenceDataset,
  astronomyDataset,
  philosophyDataset,
  scientificResearchDataset,
  productDevelopmentDataset,
  learningSystemsDataset,
  roboticsDataset,
  computerScienceDataset,
];

export function getDemoDataset(id: string): DemoDataset | undefined {
  return DEMO_DATASETS.find((dataset) => dataset.id === id);
}

export function createDemoGraph(id: string): GraphData | null {
  return getDemoDataset(id)?.create() ?? null;
}

export type { DemoDataset } from './types';
export {
  softwareEngineeringDataset,
  artificialIntelligenceDataset,
  astronomyDataset,
  philosophyDataset,
  scientificResearchDataset,
  productDevelopmentDataset,
  learningSystemsDataset,
  roboticsDataset,
  computerScienceDataset,
};
