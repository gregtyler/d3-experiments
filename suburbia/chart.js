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

  // Add the legend
  const linkTypes = data.links
    .map(link => link.link)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  const legendY = d3.scaleLinear()
    .domain([0, linkTypes.length])
    .range([40, 40 + legendHeight]);

  const legendLinks = chart.selectAll('legendLinks')
    .data(linkTypes)
    .enter()
      .append('svg:g')
      .classed('legend', true);

  legendLinks
    .on('mouseenter', (e) => {
      chart.classed('faded', true);
      chart.classed('faded--legend', true);
      d3.event.currentTarget.classList.add('active');
      lines
        .filter(l => l.link === e)
        .classed('active', true);
    })
    .on('mouseleave', () => {
      chart.classed('faded', false);
      chart.classed('faded--legend', false);
      document.querySelectorAll('.active').forEach($active => $active.classList.remove('active'));
    });

  legendLinks
    .append('svg:circle')
      .attr('cx', chartWidth + 10)
      .attr('cy', (d, index) => legendY(index))
      .attr('class', d => 'legend-dot legend-dot--' + d)
      .attr('r', 5);

  legendLinks
    .append('svg:text')
      .attr('x', chartWidth + 20)
      .attr('y', (d, index) => legendY(index))
      .attr('dy', '0.25em')
      .text(d => d.substr(0, 1).toUpperCase() + d.substr(1));

  const details = chart
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
        }))
      .on('mouseenter', (e) => {
        chart.classed('faded', true);
        d3.event.currentTarget.classList.add('active');
        details.text(e.name);
        lines
          .filter(l => l.target.id === e.id || l.source.id === e.id)
          .classed('active', true);
      })
      .on('mouseleave', () => {
        chart.classed('faded', false);
        document.querySelectorAll('.active').forEach($active => $active.classList.remove('active'));
        details.text('');
      });

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
}

/**
 * Retrieve the JSON data
 */
function fetchData() {
  return fetch('suburbia.json')
    .then(r => r.json());
}

fetchData().then(build);
