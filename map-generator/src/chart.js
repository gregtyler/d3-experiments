import seed from './lib/seed';
import relax from './lib/relax';
import setHeight from './lib/setHeight';
import {calculateWaterFlux} from './lib/waterFunctions';
import config from './config';
import {roundHeight, relaxHeight, normalizeHeight} from './lib/heightFunctions';

const layer = {};

// Create a chart
const chart = d3.select('#root')
  .append('svg:svg')
  .attr('width', config.chartWidth)
  .attr('height', config.chartHeight);

// Generate random points
let points = seed(2000);

// Relax the points a bit (with centroids)
points = relax(points);

// Generate the data for the polygons
const voronoi = d3.voronoi();
voronoi.size([config.chartWidth, config.chartHeight]);
const diagram = voronoi(points);
const polygons = diagram.polygons();
const links = diagram.links();

let cells = [];

polygons.forEach((polygon, index) => {
  cells.push({
    id: index,
    points: polygon,
    centre: polygon.data,
    height: 0,
    links: []
  });
});

links.forEach(({source, target}) => {
  source = cells.find(d => d.centre === source);
  target = cells.find(d => d.centre === target);
  source.links.push(target);
  target.links.push(source);
});

// Set a random cell to be tall
for (let i = 0; i < 3; i++) {
  setHeight(cells[Math.floor(Math.random() * cells.length)], 1);
}

cells = roundHeight(cells);
cells = relaxHeight(cells);
cells = normalizeHeight(cells);

cells.forEach(cell => cell.uphills = []);

// Work out the downhill of every cell
cells.forEach(cell => {
  const min = d3.min(cell.links, d => d.height);
  if (min < cell.height) {
    cell.downhill = cell.links.find(link => link.height === min);
    cell.downhill.uphills.push(cell);
  } else {
    cell.downhill = null;
  }
});

// Work out the water flux of every cell (how much water flows into it)
calculateWaterFlux(cells);

////// DRAWING //////
// Draw polygons
const colourRange = d3.interpolateRgb(d3.color('#faf6b7'), d3.color('#ab3d0a'));

layer.polygons = chart.append('svg:g');
layer.polygons.selectAll('polygons')
  .data(cells)
  .enter()
    .append('svg:path')
    .attr('d', d => d3.line()(d.points))
    .classed('cell', true)
    .style('color', d => d.height === 0 ? d3.color('#7da8c4') : colourRange(d.height));

// Draw downhill arrows
layer.downhills = chart.append('svg:g');
layer.downhills.selectAll('lines')
  .data(cells.filter(cell => cell.downhill !== null))
  .enter()
  .append('svg:path')
    .attr('d', d => `M${d.centre[0]},${d.centre[1]}L${d.downhill.centre[0]},${d.downhill.centre[1]}`)
    .style('stroke', d3.color('#7da8c4'))
    .style('stroke-width', d => d.waterFlux);

// Draw water flux
// layer.flux = chart.append('svg:g');
// layer.flux.selectAll('text')
//   .data(cells)
//   .enter()
//   .append('svg:text')
//     .attr('x', d => d.centre[0])
//     .attr('y', d => d.centre[1])
//     .html(d => d.waterFlux);
