import seed from './lib/seed';
import relax from './lib/relax';
import config from './config';

const layer = {};

// Create a chart
const chart = d3.select('#root')
  .append('svg:svg')
  .attr('width', config.chartWidth)
  .attr('height', config.chartHeight);

// Generate random points
let points = seed(300);

// Relax the points a bit (with centroids)
points = relax(points);

// Generate the polygons
const voronoi = d3.voronoi();
voronoi.size([config.chartWidth, config.chartHeight]);
const polygons = voronoi.polygons(points);
const links = voronoi.links(points);

const data = [];
polygons.forEach((polygon, index) => {
  data.push({
    id: index,
    points: polygon,
    centre: polygon.data,
    height: 0,
    links: []
  });
});

links.forEach(({source, target}) => {
  source = data.find(d => d.centre === source);
  target = data.find(d => d.centre === target);
  source.links.push(target);
  target.links.push(source);
});

////// DRAWING //////
// Draw points
layer.points = chart.append('svg:g');
layer.points.selectAll('.points')
  .data(points)
  .enter()
    .append('svg:circle')
    .attr('cx', d => d[0])
    .attr('cy', d => d[1])
    .attr('r', 4)
    .attr('fill', 'red');

// Draw polygons
layer.polygons = chart.append('svg:g');
layer.polygons.selectAll('polygons')
  .data(data)
  .enter()
    .append('svg:path')
    .attr('d', d => d3.line()(d.points))
    .attr('class', d => `height height-${d.height}`);
