const data = [
  {name: 'Fiona',   ranks: [{year: 2001, rank: 1}, {year: 2002, rank: 6}]},
  {name: 'Martina', ranks: [{year: 2001, rank: 2}, {year: 2002, rank: 5}]},
  {name: 'Jo',      ranks: [{year: 2001, rank: 3}, {year: 2002, rank: 4}]},
  {name: 'Doris',   ranks: [{year: 2001, rank: 4}, {year: 2002, rank: 2}]},
  {name: 'Jessica', ranks: [{year: 2001, rank: 5}, {year: 2002, rank: 1}]},
  {name: 'Parta',   ranks: [{year: 2001, rank: 6}, {year: 2002, rank: 7}]},
  {name: 'Keira',   ranks: [{year: 2001, rank: 7}, {year: 2002, rank: 3}]},
  {name: 'Nimona',  ranks: [{year: 2001, rank: 8}, {year: 2002, rank: 9}]},
  {name: 'Sate',    ranks: [{year: 2001, rank: 9}, {year: 2002, rank: 10}]},
  {name: 'Relia',   ranks: [{year: 2001, rank: 10}, {year: 2002, rank: 8}]}
];
const chartWidth = 800;
const chartHeight = 300;
const chartPadding = 30;
const barGapX = 50;
const barGapY = 10;
const barWidth = 60;
const barHeight = (chartHeight / 10) - barGapY;

// Define ranges
const x = d3
  .scaleLinear()
  .domain([0, data[0].ranks.length])
  .range([0, (barWidth + barGapX) * data[0].ranks.length]);
const y = d3
  .scaleLinear()
  .domain([1, 11])
  .range([0, chartHeight])
  .nice();

// Create a chart
const chart = d3.select('#root')
  .append('svg:svg')
  .attr('width', chartWidth + (chartPadding * 2))
  .attr('height', chartHeight + (chartPadding * 2));

// Create group for axes
const frameGroup = chart.append('svg:g');

// Add x-axis
frameGroup.selectAll('text.xAxis')
  .data([2001, 2002])
  .enter()
    .append('svg:text')
    .attr('x', (datum, index) => x(index))
    .attr('y', chartHeight)
    .attr('dx', barWidth / 2)
    .attr('text-anchor', 'middle')
    .text(datum => datum)
    .attr('transform', 'translate(0, 18)');

// Add bars
const barGroup = chart.append('svg:g');
data.forEach(function(player) {
  player.colour = d3.color(`hsl(${Math.random() * 360 | 0}, 50%, 50%)`);
  // Add bar
  barGroup.selectAll('bars.' + player.name)
    .data(player.ranks)
    .enter()
      .append('svg:rect')
      .attr('x', (datum, index) => x(index))
      .attr('y', (datum) => y(datum.rank))
      .attr('width', barWidth)
      .attr('height', barHeight)
      .attr('fill', player.colour);

  // Add links
  /**
   * Define a path for a link between years
   * @param {Object} datum The data that is being linked to the next year
   * @param {Number} index The index of the datum amongst the ranks of the player
   * @param {Object} ranks All of the player's ranks
   */
  function linkPath(datum, index, ranks) {
    const path = d3.path();
    const x1 = x(index) + barWidth;
    const y1 = y(datum.rank);
    const x2 = x(index + 1);
    const y2 = y(ranks[index + 1].rank);

    path.moveTo(x1, y1);
    path.bezierCurveTo(x1 + (barGapX / 2), y1, x2 - (barGapX / 2), y2, x2, y2);
    path.lineTo(x2, y2 + barHeight);
    path.bezierCurveTo(x2 - (barGapX / 2), y2 + barHeight, x1 + (barGapX / 2), y1 + barHeight, x1, y1 + barHeight);
    path.closePath();
    return path.toString();
  }

  player.colour.opacity = 0.5;
  barGroup.selectAll('links.' + player.name)
    .data(player.ranks.slice(0, -1))
    .enter()
      .append('svg:path')
      .attr('d', (datum, index) => linkPath(datum, index, player.ranks))
      .attr('fill', player.colour);
});
