import type { LayoutOptions, PositionMap } from './types';
import { radialLayout } from './radial';
import { seededRandom } from '@/lib/utils/math';

/** Seeded, nature-like variation around a radial scaffold. */
export function organicLayout(options: LayoutOptions): PositionMap {
  const base = radialLayout({ ...options, radius: options.radius ?? 34 });
  const random = seededRandom(options.seed ?? 19);
  const positions: PositionMap = new Map();
  for (const [id, position] of base) {
    const drift = 3 + random() * 5;
    positions.set(id, {
      x: position.x + (random() - 0.5) * drift,
      y: position.y + (random() - 0.5) * drift * 1.5,
      z: position.z + (random() - 0.5) * drift,
    });
  }
  return positions;
}
