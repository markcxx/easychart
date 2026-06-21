import type { ScatterPoint } from '@/types';

export const SCATTER_CLUSTER_COUNT = 6;
export const SCATTER_CLUSTER_DIMENSION_INDEX = 2;
export const SCATTER_CLUSTER_COLORS = [
  '#5070dd',
  '#b6d634',
  '#505372',
  '#ff994d',
  '#0ca8df',
  '#ffd10a',
  '#fb628b',
  '#785db0',
  '#3fbe95',
];

export type ClusteredScatterPoint = [number, number, number];

function distanceSquared(point: ScatterPoint, center: ScatterPoint) {
  const x = point[0] - center[0];
  const y = point[1] - center[1];
  return x * x + y * y;
}

export function clusterScatterPoints(points: ScatterPoint[], clusterCount = SCATTER_CLUSTER_COUNT): ClusteredScatterPoint[] {
  if (!points.length) return [];

  const actualClusterCount = Math.min(clusterCount, points.length);
  let centers = Array.from({ length: actualClusterCount }, (_, index) => {
    const sourceIndex = actualClusterCount === 1
      ? 0
      : Math.floor(index * (points.length - 1) / (actualClusterCount - 1));
    return points[sourceIndex];
  });
  let assignments = points.map(() => 0);

  for (let iteration = 0; iteration < 16; iteration += 1) {
    assignments = points.map((point) => {
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      centers.forEach((center, centerIndex) => {
        const currentDistance = distanceSquared(point, center);
        if (currentDistance < nearestDistance) {
          nearestDistance = currentDistance;
          nearestIndex = centerIndex;
        }
      });

      return nearestIndex;
    });

    centers = centers.map((center, centerIndex) => {
      const members = points.filter((_, pointIndex) => assignments[pointIndex] === centerIndex);
      if (!members.length) return center;

      const sum = members.reduce<ScatterPoint>(
        (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
        [0, 0]
      );

      return [sum[0] / members.length, sum[1] / members.length];
    });
  }

  return points.map((point, index) => [point[0], point[1], assignments[index] ?? 0]);
}
