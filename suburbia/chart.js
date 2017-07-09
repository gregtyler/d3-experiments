// Variables
const chartWidth = 600;
const chartHeight = 600;
const legendWidth = 200;
const legendHeight = 135;
const characterRadius = 10;

// Create SVG
const chart = d3.select('#root')
  .append('svg:svg')
  .attr('width', chartWidth + legendWidth)
  .attr('height', chartHeight)
  .style('padding', '30px');

const $root = chart.node();

// Create simulation
const simulation = d3.forceSimulation()
  .force('charge', d3.forceManyBody().strength(-2000))
  .force('center', d3.forceCenter(chartWidth / 2, chartHeight / 2));

/**
 * Build the initial chart
 * @param {Object} data The data to use to build the chart
 */
function build(data) {
  let nodes = null;
  let lines = null;
  const sites = [];

  // Add the legend
  const linkTypes = data.links
    .map(link => link.link)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  const legendY = d3.scaleLinear()
    .domain([1, linkTypes.length + 1])
    .range([40, 40 + legendHeight]);

  const legend = chart.append('svg:g');
  const legendLinks = legend.selectAll('legendLinks')
    .data(linkTypes)
    .enter()
      .append('svg:g')
      .classed('legend', true)
      .each(legend => {sites.push(legend);});

  legendLinks
    .append('svg:circle')
      .attr('cx', chartWidth + 10)
      .attr('cy', (d, index) => legendY(index) - 4)
      .attr('class', d => 'legend-dot legend-dot--' + d)
      .attr('r', 5);

  legendLinks
    .append('svg:text')
      .attr('x', chartWidth + 20)
      .attr('y', (d, index) => legendY(index))
      .text(d => d.substr(0, 1).toUpperCase() + d.substr(1));

  const details = legend
    .append('svg:text')
      .attr('x', chartWidth)
      .attr('y', 60 + legendHeight)
      .style('font-weight', 'bold');

  // Build the force diagram
  lines = chart.append('g')
    .selectAll('lines')
    .data(data.links)
    .enter()
      .append('svg:line')
      .attr('class', d => 'connection connection--' + d.link);

  nodes = chart.append('g')
    .selectAll('circles')
    .data(data.nodes)
    .enter()
      .append('svg:circle')
      .attr('r', d => (d.played ? 2 : 1) * characterRadius)
      .classed('character', true)
      .call(d3.drag()
        .on('start', d => {
          if (!d3.event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', d => {d.fx = d3.event.x; d.fy = d3.event.y;})
        .on('end', d => {
          if (!d3.event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

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

  // Start the simulation
  simulation
    .nodes(data.nodes)
    .on('tick', tick)
    .force('link',
      d3.forceLink(data.links)
        .id(d => d.id)
    );

  // Create a Voronoi to handle node hovering
  const nodeVoronoi = d3
    .voronoi()
    .extent([[0, 0], [chartWidth, chartHeight]])
    .x(d => d.x)
    .y(d => d.y);

  chart.append('svg:rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .attr('fill', 'transparent')
    .on('mousemove', () => {
      // Find the nearest site
      const [mx, my] = d3.mouse($root);
      const site = nodeVoronoi(nodes.data()).find(mx, my);

      chart.classed('faded', true);
      document.querySelectorAll('.active').forEach($active => $active.classList.remove('active'));
      nodes.filter(d => d.id === site.data.id).classed('active', true);
      details.text(site.data.name);
      lines
        .filter(l => l.target.id === site.data.id || l.source.id === site.data.id)
        .classed('active', true);
    })
    .on('mouseleave', () => {
      chart.classed('faded', false);
      document.querySelectorAll('.active').forEach($active => $active.classList.remove('active'));
      details.text('');
    });

  // Create a Voronoi to handle legend hovering
  const legendVoronoi = d3
    .voronoi()
    .extent([[chartWidth, 0], [chartWidth + legendWidth, legendHeight]])
    .x(chartWidth)
    .y((d, index) => legendY(index))
    (sites);

  chart.append('svg:rect')
    .attr('x', chartWidth)
    .attr('y', 0)
    .attr('width', chartWidth + legendWidth)
    .attr('height', legendHeight)
    .attr('fill', 'transparent')
    .on('mousemove', () => {
      // Find the nearest site
      const [mx, my] = d3.mouse($root);
      const site = legendVoronoi.find(mx, my);

      chart.classed('faded', true);
      chart.classed('faded--legend', true);
      document.querySelectorAll('.active').forEach($active => $active.classList.remove('active'));
      legendLinks.filter(d => d === site.data).classed('active', true);
      lines
        .filter(l => l.link === site.data)
        .classed('active', true);
    })
    .on('mouseleave', () => {
      chart.classed('faded', false);
      chart.classed('faded--legend', false);
      document.querySelectorAll('.active').forEach($active => $active.classList.remove('active'));
    });
}

/**
 * Retrieve the JSON data
 */
function fetchData() {
  return fetch('suburbia.json')
    .then(r => r.json());
}

fetchData().then(build);
