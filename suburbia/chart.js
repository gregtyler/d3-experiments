// Variables
const chartWidth = 800;
const chartHeight = 600;
const characterRadius = 10;

// Create SVG
const chart = d3.select('#root')
  .append('svg:svg')
  .attr('width', chartWidth)
  .attr('height', chartHeight)
  .style('padding', '30px');

// Create simulation
const simulation = d3.forceSimulation()
  .force('charge', d3.forceManyBody())
  .force('center', d3.forceCenter(chartWidth / 2, chartHeight / 2));

/**
 * Build the initial chart
 * @param {Object} data The data to use to build the chart
 */
function build(data) {
  const lines = chart.append('g')
    .selectAll('lines')
    .data(data.links)
    .enter()
      .append('svg:line')
      .attr('class', d => 'connection connection--' + d.link);

  const nodes = chart.append('g')
    .selectAll('circles')
    .data(data.nodes)
    .enter()
      .append('svg:circle')
      .attr('r', d => (d.played ? 2 : 1) * characterRadius)
      .classed('character', true);

  nodes
    .append('title')
      .text(d => d.name);

  /**
   * After the chart has been changed (due to force), make sure nothing is over the edge
   */
  function tick() {
    nodes
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .each(node => {
        if (node.x - characterRadius < 0) {
            node.x = characterRadius;
            node.vx = 0;
        }

        if (node.y - characterRadius < 0) {
            node.y = characterRadius;
            node.vy = 0;
        }

        if (node.x + characterRadius > chartWidth) {
            node.x = chartWidth - characterRadius;
            node.vx = 0;
        }

        if (node.y + characterRadius > chartHeight) {
            node.y = chartHeight - characterRadius;
            node.vy = 0;
        }
      });

    lines
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
  }

  simulation
    .nodes(data.nodes)
    .on('tick', tick)
    .force('link',
      d3.forceLink(data.links)
        .strength(0.01)
        .distance(500)
        .id(d => d.id)
    );
}

/**
 * Retrieve the JSON data
 */
function fetchData() {
  return fetch('suburbia.json')
    .then(r => r.json());
}

fetchData().then(build);
