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
          // Ranking was taken on January 1st, so it is the year-end ranking of the previous year
          ranking.year = parseInt(ranking.date.substr(0, 4), 10) - 1;
          // Convert rank to integer
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
  const $selected = document.querySelector('#selected');
  const chartWidth = 800;
  const chartHeight = 300;
  const chartPadding = 30;
  const barGapX = 50;
  const barGapY = 0;
  const barWidth = 60;
  const barHeight = (chartHeight / 10) - barGapY;

  // Determine which years we're working with
  const years = data.reduce((prev, player) => {
      player.ranks.forEach(rank => prev.push(rank.year));
      return prev;
    }, [])
    .filter((year, index, arr) => arr.indexOf(year) === index)
    .sort();

  const minYear = Math.min.apply(window, years);
  const maxYear = Math.max.apply(window, years);

  // Define ranges
  const x = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([chartPadding, chartPadding + ((barWidth + barGapX) * years.length)]);
  const y = d3
    .scaleLinear()
    .domain([1, 11])
    .range([chartPadding, chartPadding + chartHeight])
    .nice();

  /**
   * Work out how thick a player's bar should be, based on their age
   * @param {Integer} year The year the ranking is of
   * @param {Integer} dobYear The player's date of birth
   */
  function getBarHeight(year, dob) {
    return barHeight * (year - dob.substr(0, 4) - 10) / 30;
  }

  // Create a chart
  const chart = d3.select('#root')
    .append('svg:svg')
    .attr('width', chartWidth + (chartPadding * 2))
    .attr('height', chartHeight + (chartPadding * 2));

  // Add bars
  const barGroup = chart.append('svg:g');
  data.forEach(function(player) {
    player.colour = d3.color(`hsl(${Math.random() * 360 | 0}, 70%, 70%)`);
    const playerGroup = barGroup.append('svg:g');
    // Add bar
    playerGroup.selectAll('bars.player' + player.id)
      .data(player.ranks)
      .enter()
        .append('svg:rect')
        .attr('x', datum => x(datum.year))
        .attr('y', datum => y(datum.rank))
        .attr('width', barWidth)
        .attr('height', datum => getBarHeight(datum.year, player.dob))
        .attr('fill', player.colour)
        .on('mouseover', () => {
          $selected.innerHTML = player.forename + ' ' + player.surname;
          barGroup.classed('faded', true);
          playerGroup.classed('active', true);
        })
        .on('mouseout', () => {
          $selected.innerHTML = 'Hover over a bar to see player\'s name';
          barGroup.classed('faded', false);
          playerGroup.classed('active', false);
        });

    // Add links
    /**
     * Define a path for a link between years
     * @param {Object} datum The data that is being linked to the next year
     * @param {Number} index The index of the datum amongst the ranks of the player
     * @param {Object} player The player data
     * @returns {String} A string to use in the "d" attribute of an SVG path
     */
    function linkPath(fromRank, toRank) {
      const path = d3.path();
      const x1 = x(fromRank.year) + barWidth;
      const y1 = y(fromRank.rank);
      const x2 = x(toRank.year);
      const y2 = y(toRank.rank);
      const barHeight1 = getBarHeight(fromRank.year, player.dob);
      const barHeight2 = getBarHeight(toRank.year, player.dob);

      path.moveTo(x1, y1);
      path.bezierCurveTo(x1 + (barGapX / 2), y1, x2 - (barGapX / 2), y2, x2, y2);
      path.lineTo(x2, y2 + barHeight2);
      path.bezierCurveTo(x2 - (barGapX / 2), y2 + barHeight2, x1 + (barGapX / 2), y1 + barHeight1, x1, y1 + barHeight1);
      path.closePath();
      return path.toString();
    }

    player.colour.opacity = 0.8;
    player.ranks.forEach(function(rank) {
      const prev = player.ranks.find(datum => datum.year === rank.year - 1);
      let next = player.ranks.find(datum => datum.year === rank.year + 1);

      // If they weren't ranked last year, do a drop-on
      if (typeof prev === 'undefined' && rank.year !== minYear) {
        playerGroup
          .append('svg:path')
          .attr('d', linkPath({year: rank.year - 1, rank: rank.rank + 10}, rank))
          .attr('fill', player.colour);
      }

      // If next isn't defined, do a drop off
      if (typeof next === 'undefined') next = {year: rank.year + 1, rank: rank.rank + 10};

      // Draw a link to the next rank
      playerGroup
        .append('svg:path')
        .attr('d', linkPath(rank, next))
        .attr('fill', player.colour);
    });
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
