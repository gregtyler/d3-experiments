var config = {
  chartWidth: 800,
  chartHeight: 600
};

function seed(count) {
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push([Math.random() * config.chartWidth, Math.random() * config.chartHeight]);
  }

  return points;
}

function relax(points) {
  const voronoi = d3.voronoi();
  voronoi.size([config.chartWidth, config.chartHeight]);
  const newPoints = [];

  voronoi.polygons(points).forEach(polygon => {
    newPoints.push(d3.polygonCentroid(polygon));
  });

  return newPoints;
}

const heightFunctions = {
  cone: parentHeight => (0.7 * (parentHeight)),
  hill: () => 0.7,
  cos: parentHeight => Math.cos(parentHeight) / 4
};

function setHeight(cell, height, type = 'random') {
  // Deal with the type
  if (type === 'random') {
    type = Object.keys(heightFunctions)[Math.floor(Math.random() * Object.keys(heightFunctions).length)];
  }

  // Set height
  cell.height = height;

  // Build a list of neighbouring cells
  const queue = cell.links.map(cell => [cell, height]);

  // Set the height of each cell in the list and, if it's still above sea-level,
  // then iterate down to neighbours. Using push/shift makes the order work.
  while (queue.length) {
    const [cell, parentHeight] = queue.shift();
    const subHeight = Math.max(parentHeight - heightFunctions[type](parentHeight) + (Math.random() * 0.1), 0);
    cell.height = subHeight;

    if (subHeight > 0.1) {
      cell.links
        .filter(neighbour => neighbour.height === 0)
        .forEach(neighbour => {
          queue.push([neighbour, subHeight]);
        });
    }
  }
}

function getWaterFlux(cell) {
  if (cell.uphills.length === 0) {
   cell.waterFlux = 0;
  } else if (typeof cell.waterFlux === 'undefined') {
    cell.waterFlux = cell.uphills.length + cell.uphills.reduce((sum, uphill) => getWaterFlux(uphill), 0);
  }

  return cell.waterFlux;
}

function calculateWaterFlux(cells) {
  cells.forEach(cell => {
    getWaterFlux(cell);
  });
}

function roundHeight(cells) {
  return cells.map(cell => {
    cell.height = Math.sqrt(cell.height);
    return cell;
  });
}

function relaxHeight(cells) {
  return cells.map(cell => {
    cell.height = cell.links.reduce((sum, neighbour) => sum + neighbour.height, 0) / cell.links.length;
    return cell;
  });
}

function normalizeHeight(cells) {
  const heightScale = d3.scaleLinear()
    .domain([d3.min(cells, d => d.height), d3.max(cells, d => d.height)]);

  return cells.map(cell => {
    cell.height = heightScale(cell.height);
    return cell;
  });
}

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
