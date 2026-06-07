const tooltip = d3.select('.tooltip');
const margin = { top: 20, right: 30, bottom: 40, left: 60 };

function drawLineChart(containerId, data, color, yLabel, format = d => d) {
  const container = document.getElementById(containerId);
  const width  = container.offsetWidth - margin.left - margin.right;
  const height = 260 - margin.top - margin.bottom;

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => +d.year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d.value) * 1.1])
    .range([height, 0]);

  // Grid lines
  svg.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
    .selectAll('line').attr('stroke', '#1e293b');
  svg.select('.grid .domain').remove();

  // Axes
  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#94a3b8');

  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(format))
    .selectAll('text').attr('fill', '#94a3b8');

  // Line
  const line = d3.line()
    .x(d => x(+d.year))
    .y(d => y(+d.value))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 2.5)
    .attr('d', line);

  // Area fill
  const area = d3.area()
    .x(d => x(+d.year))
    .y0(height)
    .y1(d => y(+d.value))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(data)
    .attr('fill', color)
    .attr('opacity', 0.1)
    .attr('d', area);

  // Dots
  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => x(+d.year))
    .attr('cy', d => y(+d.value))
    .attr('r', 4)
    .attr('fill', color)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.year}</strong><br/>${yLabel}: ${format(+d.value)}`);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 12) + 'px')
        .style('top',  (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));
}

// ── Load & Draw ──
d3.csv('data/economy.csv').then(function(data) {

  // GDP
  const gdp = data
    .filter(d => d.indicator_code === 'NY.GDP.MKTP.CD')
    .map(d => ({ year: +d.year, value: +d.value / 1e9 }));
  drawLineChart('gdp-chart', gdp, '#22c55e', 'GDP', d => `$${d.toFixed(0)}B`);

  // Inflation
  const inflation = data
    .filter(d => d.indicator_code === 'FP.CPI.TOTL.ZG')
    .map(d => ({ year: +d.year, value: +d.value }));
  drawLineChart('inflation-chart', inflation, '#f59e0b', 'Inflation', d => `${d.toFixed(1)}%`);

  // Exports vs Imports — grouped bar chart
  const exports_ = data.filter(d => d.indicator_code === 'NE.EXP.GNFS.ZS');
  const imports_ = data.filter(d => d.indicator_code === 'NE.IMP.GNFS.ZS');

  const years = exports_.map(d => +d.year);
  const tradeData = years.map(yr => ({
    year: yr,
    exports: +exports_.find(d => +d.year === yr)?.value || 0,
    imports: +imports_.find(d => +d.year === yr)?.value || 0
  }));

  drawTradeChart(tradeData);
});

function drawTradeChart(data) {
  const container = document.getElementById('trade-chart');
  const width  = container.offsetWidth - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;

  const svg = d3.select('#trade-chart')
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand()
    .domain(data.map(d => d.year))
    .range([0, width])
    .padding(0.2);

  const x1 = d3.scaleBand()
    .domain(['exports', 'imports'])
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => Math.max(d.exports, d.imports)) * 1.1])
    .range([height, 0]);

  const colors = { exports: '#22c55e', imports: '#ef4444' };

  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0).tickValues(
      data.filter((_, i) => i % 3 === 0).map(d => d.year)
    ).tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#94a3b8');

  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
    .selectAll('text').attr('fill', '#94a3b8');

  const groups = svg.selectAll('g.bar-group')
    .data(data).enter()
    .append('g')
    .attr('transform', d => `translate(${x0(d.year)},0)`);

  ['exports', 'imports'].forEach(key => {
    groups.append('rect')
      .attr('x', x1(key))
      .attr('y', d => y(d[key]))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d[key]))
      .attr('fill', colors[key])
      .attr('rx', 2)
      .on('mouseover', function(event, d) {
        tooltip.style('opacity', 1)
          .html(`<strong>${d.year}</strong><br/>${key}: ${d[key].toFixed(1)}%`);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 12) + 'px')
          .style('top',  (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => tooltip.style('opacity', 0));
  });

  // Legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 150}, 0)`);
  ['exports', 'imports'].forEach((key, i) => {
    legend.append('rect')
      .attr('x', 0).attr('y', i * 20)
      .attr('width', 12).attr('height', 12)
      .attr('fill', colors[key]).attr('rx', 2);
    legend.append('text')
      .attr('x', 18).attr('y', i * 20 + 10)
      .attr('fill', '#94a3b8').style('font-size', '12px')
      .text(key.charAt(0).toUpperCase() + key.slice(1));
  });
}