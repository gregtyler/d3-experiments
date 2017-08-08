import config from '../config';

export default function seed(count) {
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push([Math.random() * config.chartWidth, Math.random() * config.chartHeight]);
  }

  return points;
}
