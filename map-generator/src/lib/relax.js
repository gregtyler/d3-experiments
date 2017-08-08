import config from '../config';

export default function relax(points) {
  const voronoi = d3.voronoi();
  voronoi.size([config.chartWidth, config.chartHeight]);
  const newPoints = [];

  voronoi.polygons(points).forEach(polygon => {
    newPoints.push(d3.polygonCentroid(polygon));
  });

  return newPoints;
}
