fetch('data/data.json')
  .then(response => response.json())
  .then(json => {
    const chartWidth = 1000;
    const chartHeight = 1000;
    const chartPadding = 0;

    const root = d3.hierarchy(json).sum(() => 1);
    const pack = d3.pack()
      .size([chartWidth, chartHeight])
      .padding(chartPadding);

    const nodes = pack(root).descendants();

    // Create a chart
    const chart = d3.select('#root')
      .append('svg:svg')
      .attr('width', chartWidth + (chartPadding * 2))
      .attr('height', chartHeight + (chartPadding * 2));

    chart.selectAll('circle')
      .data(nodes)
      .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => d.r)
        .attr('class', d => `circle circle--${d.depth}`)
        .on('click', (d) => {console.log(d.data.name + ', ' + d.depth);});
  });
