/**
 * Retrieve the data for the WTA players
 * @returns {Object} An array of player data from the CSV
 */
function fetchPlayers() {
  return fetch('players.csv')
    .then(resp => resp.text())
    .then(content => {
      return d3.csvParse(content).map(player => {
        player.ranks = [];
        return player;
      });
    });
}

/**
 * Retrieve the data for the WTA rankings
 * @param {Object} players An array of the players to rank
 * @returns {Object} The array of players, now with rankings
 */
function fetchRankings(players) {
  return fetch('rankings.csv')
    .then(resp => resp.text())
    .then(content => {
      d3.csvParse(content)
        .filter(ranking => ranking.date.substr(4) === '0101' && ranking.rank <= 10)
        .forEach(ranking => {
          const player = players.find(player => player.id === ranking.playerId);
          ranking.year = parseInt(ranking.date.substr(0, 4), 10);
          ranking.rank = parseInt(ranking.rank, 10);
          player.ranks.push(ranking);
        });

      return players;
    });
}

/**
 * Build the chart
 * @param {Object} data The rankings data to use in the chart
 */
function buildChart(data) {
  const chartWidth = 800;
  const chartHeight = 300;
  const chartPadding = 30;
  const barGapX = 50;
  const barGapY = 10;
  const barWidth = 60;
  const barHeight = (chartHeight / 10) - barGapY;

  const years = data.reduce((prev, player) => {
      player.ranks.forEach(rank => prev.push(rank.year));
      return prev;
    }, [])
    .filter((year, index, arr) => arr.indexOf(year) === index)
    .sort();

  // Define ranges
  const x = d3
    .scaleLinear()
    .domain([Math.min.apply(window, years), Math.max.apply(window, years)])
    .range([chartPadding, chartPadding + ((barWidth + barGapX) * years.length)]);
  const y = d3
    .scaleLinear()
    .domain([1, 11])
    .range([chartPadding, chartPadding + chartHeight])
    .nice();

  // Create a chart
  const chart = d3.select('#root')
    .append('svg:svg')
    .attr('width', chartWidth + (chartPadding * 2))
    .attr('height', chartHeight + (chartPadding * 2));

  // Add bars
  const barGroup = chart.append('svg:g');
  data.forEach(function(player) {
    player.colour = d3.color(`hsl(${Math.random() * 360 | 0}, 50%, 50%)`);
    const playerGroup = barGroup.append('svg:g');
    // Add bar
    playerGroup.selectAll('bars.' + player.name)
      .data(player.ranks)
      .enter()
        .append('svg:rect')
        .attr('x', datum => x(datum.year))
        .attr('y', datum => y(datum.rank))
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('fill', player.colour)
        .on('mouseover', () => {
          barGroup.classed('faded', true);
          playerGroup.classed('active', true);
        })
        .on('mouseout', () => {
          barGroup.classed('faded', false);
          playerGroup.classed('active', false);
        });

    // Add links
    /**
     * Define a path for a link between years
     * @param {Object} datum The data that is being linked to the next year
     * @param {Number} index The index of the datum amongst the ranks of the player
     * @param {Object} ranks All of the player's ranks
     */
    function linkPath(datum, index, ranks) {
      const path = d3.path();
      const next = ranks.find(rank => rank.year === datum.year + 1);
      const x1 = x(datum.year) + barWidth;
      const y1 = y(datum.rank);
      const x2 = x(datum.year + 1);
      const y2 = next ? y(next.rank) : y(datum.rank + 10);

      path.moveTo(x1, y1);
      path.bezierCurveTo(x1 + (barGapX / 2), y1, x2 - (barGapX / 2), y2, x2, y2);
      path.lineTo(x2, y2 + barHeight);
      path.bezierCurveTo(x2 - (barGapX / 2), y2 + barHeight, x1 + (barGapX / 2), y1 + barHeight, x1, y1 + barHeight);
      path.closePath();
      return path.toString();
    }

    player.colour.opacity = 0.5;
    playerGroup.selectAll('links.' + player.name)
      .data(player.ranks)
      .enter()
        .append('svg:path')
        .attr('d', (datum, index) => linkPath(datum, index, player.ranks))
        .attr('fill', player.colour);
  });

  // Create group for axes and framing
  const frameGroup = chart.append('svg:g');

  // Add a bar to cover the players diving out of the rankings
  frameGroup
    .append('svg:rect')
    .attr('x', 0)
    .attr('y', chartHeight + chartPadding)
    .attr('width', chartWidth + (chartPadding * 2))
    .attr('height', chartPadding)
    .attr('fill', 'white');

  // Add x-axis
  frameGroup.selectAll('text.xAxis')
    .data(years)
    .enter()
      .append('svg:text')
      .attr('x', year => x(year))
      .attr('y', chartHeight + chartPadding)
      .attr('dx', barWidth / 2)
      .attr('text-anchor', 'middle')
      .text(datum => datum)
      .attr('transform', 'translate(0, 18)');
}

fetchPlayers()
  .then(fetchRankings)
  .then(buildChart);
