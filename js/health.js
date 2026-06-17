const tooltip = d3.select('.tooltip');
const margin = { top: 20, right: 30, bottom: 40, left: 60 };

function drawLine(containerId, data, color, yLabel, formatFn) {
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
    .domain(d3.extent(data, d => d.year)).range([0, width]);
  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.value) * 0.9,
             d3.max(data, d => d.value) * 1.1])
    .range([height, 0]);

  // Grid
  svg.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
    .selectAll('line').attr('stroke', '#1e293b');
  svg.select('.grid .domain').remove();

  // Area
  svg.append('path').datum(data)
    .attr('fill', color).attr('opacity', 0.12)
    .attr('d', d3.area()
      .x(d => x(d.year)).y0(height).y1(d => y(d.value))
      .curve(d3.curveMonotoneX));

  // Line
  svg.append('path').datum(data)
    .attr('fill', 'none').attr('stroke', color)
    .attr('stroke-width', 2.5)
    .attr('d', d3.line()
      .x(d => x(d.year)).y(d => y(d.value))
      .curve(d3.curveMonotoneX));

  // Dots
  svg.selectAll('circle').data(data).enter().append('circle')
    .attr('cx', d => x(d.year)).attr('cy', d => y(d.value))
    .attr('r', 4).attr('fill', color)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.year}</strong><br/>${yLabel}: ${formatFn(d.value)}`);
    })
    .on('mousemove', function(event) {
      tooltip.style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // Axes
  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#94a3b8');
  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(formatFn))
    .selectAll('text').attr('fill', '#94a3b8');
}

function drawBedsBar(data) {
  const container = document.getElementById('beds-chart');
  const width  = container.offsetWidth - margin.left - margin.right;
  const height = 220 - margin.top - margin.bottom;

  const svg = d3.select('#beds-chart')
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.year)).range([0, width]).padding(0.25);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value) * 1.2]).range([height, 0]);

  const colorScale = d3.scaleSequential()
    .domain([d3.min(data, d => d.value), d3.max(data, d => d.value)])
    .interpolator(d3.interpolateGreens);

  svg.selectAll('rect').data(data).enter().append('rect')
    .attr('x', d => x(d.year))
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.value))
    .attr('fill', d => colorScale(d.value))
    .attr('rx', 3)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.year}</strong><br/>Beds: ${d.value.toFixed(2)} per 1,000`);
    })
    .on('mousemove', function(event) {
      tooltip.style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickValues(data.filter((_, i) => i % 3 === 0).map(d => d.year))
      .tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#94a3b8');
  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(d => d.toFixed(1)))
    .selectAll('text').attr('fill', '#94a3b8');
}

// ── Load & Draw ──
d3.csv('data/health.csv').then(function(data) {

  const parse = code => data
    .filter(d => d.indicator_code === code && !isNaN(+d.value))
    .map(d => ({ year: +d.year, value: +d.value }))
    .sort((a, b) => a.year - b.year);

  drawLine('life-chart',
    parse('SP.DYN.LE00.IN'), '#22c55e',
    'Life Expectancy', d => `${d.toFixed(1)} yrs`);

  drawLine('imr-chart',
    parse('SP.DYN.IMRT.IN'), '#ef4444',
    'Infant Mortality', d => `${d.toFixed(1)}`);

  drawLine('nutrition-chart',
    parse('SN.ITK.DEFC.ZS'), '#f59e0b',
    'Undernourishment', d => `${d.toFixed(1)}%`);

  drawBedsBar(parse('SH.MED.BEDS.ZS'));

}).catch(err => console.error('Error:', err));