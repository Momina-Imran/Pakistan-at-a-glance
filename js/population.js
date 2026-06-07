const tooltip = d3.select('.tooltip');
const margin = { top: 20, right: 30, bottom: 40, left: 70 };

// ── Load Data ──
Promise.all([
  d3.csv('data/population.csv'),
  d3.csv('data/hdi_clean.csv')
]).then(function([popData, hdiData]) {

  // ── Chart 1: Population Growth Line Chart ──
  const totalPop = popData
    .filter(d => d.indicator_code === 'SP.POP.TOTL')
    .map(d => ({ year: +d.year, value: +d.value / 1e6 }))
    .sort((a, b) => a.year - b.year);

  drawPopGrowth(totalPop);

  // ── Chart 2: Urban vs Rural Donut ──
  const urbanData = popData.filter(d => d.indicator_code === 'SP.URB.TOTL.IN.ZS');
  const ruralData = popData.filter(d => d.indicator_code === 'SP.RUR.TOTL.ZS');

  function getDonutData(year) {
    const u = urbanData.find(d => +d.year === year);
    const r = ruralData.find(d => +d.year === year);
    return [
      { label: 'Urban', value: u ? +u.value : 0 },
      { label: 'Rural', value: r ? +r.value : 0 }
    ];
  }

  drawDonut(getDonutData(2023));

  // Slider interaction
  d3.select('#year-slider').on('input', function() {
    const yr = +this.value;
    d3.select('#slider-year-label').text(yr);
    d3.select('#donut-chart svg').remove();
    drawDonut(getDonutData(yr));
  });

  // ── Chart 3: HDI Bar Chart ──
  const hdi2023 = hdiData
    .filter(d => +d.year === 2023)
    .sort((a, b) => b.hdi - a.hdi);

  drawHDIBar(hdi2023);

}).catch(err => console.error('Error:', err));


// ── Population Growth ──
function drawPopGrowth(data) {
  const container = document.getElementById('pop-growth-chart');
  const width  = container.offsetWidth - margin.left - margin.right;
  const height = 260 - margin.top - margin.bottom;

  const svg = d3.select('#pop-growth-chart')
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value) * 1.1])
    .range([height, 0]);

  // Grid
  svg.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
    .selectAll('line').attr('stroke', '#1e293b');
  svg.select('.grid .domain').remove();

  // Area
  svg.append('path')
    .datum(data)
    .attr('fill', '#22c55e')
    .attr('opacity', 0.15)
    .attr('d', d3.area()
      .x(d => x(d.year))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX)
    );

  // Line
  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#22c55e')
    .attr('stroke-width', 2.5)
    .attr('d', d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)
    );

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#94a3b8');

  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `${d.toFixed(0)}M`))
    .selectAll('text').attr('fill', '#94a3b8');

  // Dots + Tooltip
  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => x(d.year))
    .attr('cy', d => y(d.value))
    .attr('r', 4)
    .attr('fill', '#22c55e')
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.year}</strong><br/>Population: ${d.value.toFixed(1)}M`);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 12) + 'px')
        .style('top',  (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // Y axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -55)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .style('font-size', '11px')
    .text('Population (Millions)');
}


// ── Donut Chart ──
function drawDonut(data) {
  const size   = 220;
  const radius = size / 2;
  const colors = { Urban: '#22c55e', Rural: '#0ea5e9' };

  const svg = d3.select('#donut-chart')
    .append('svg')
    .attr('width', size)
    .attr('height', size)
    .style('display', 'block')
    .style('margin', '0 auto')
    .append('g')
    .attr('transform', `translate(${radius},${radius})`);

  const pie = d3.pie().value(d => d.value).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius * 0.85);

  const arcs = svg.selectAll('path')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', d => colors[d.data.label])
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 2)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.data.label}</strong><br/>${d.data.value.toFixed(1)}%`);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 12) + 'px')
        .style('top',  (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // Center label
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.2em')
    .attr('fill', '#f1f5f9')
    .style('font-size', '13px')
    .text('Urban');
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1em')
    .attr('fill', '#22c55e')
    .style('font-size', '18px')
    .style('font-weight', '600')
    .text(`${data[0].value.toFixed(1)}%`);

  // Legend
  const legend = d3.select('#donut-chart')
    .append('div')
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('gap', '1.5rem')
    .style('margin-top', '0.5rem');

  data.forEach(d => {
    const item = legend.append('div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '6px');
    item.append('div')
      .style('width', '12px').style('height', '12px')
      .style('border-radius', '3px')
      .style('background', colors[d.label]);
    item.append('span')
      .style('color', '#94a3b8')
      .style('font-size', '12px')
      .text(`${d.label}: ${d.value.toFixed(1)}%`);
  });
}


// ── HDI Horizontal Bar Chart ──
function drawHDIBar(data) {
  const container = document.getElementById('hdi-bar-chart');
  const width  = container.offsetWidth - margin.left - 40;
  const height = data.length * 36;

  const svg = d3.select('#hdi-bar-chart')
    .append('svg')
    .attr('width',  width  + margin.left + 40)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, 0.75])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.Region))
    .range([0, height])
    .padding(0.3);

  const colorScale = d3.scaleSequential()
    .domain([0.38, 0.70])
    .interpolator(d3.interpolateGreens);

  svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', d => y(d.Region))
    .attr('width', d => x(+d.hdi))
    .attr('height', y.bandwidth())
    .attr('fill', d => colorScale(+d.hdi))
    .attr('rx', 4)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.Region}</strong><br/>HDI: ${(+d.hdi).toFixed(3)}`);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 12) + 'px')
        .style('top',  (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // Value labels
  svg.selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('x', d => x(+d.hdi) + 6)
    .attr('y', d => y(d.Region) + y.bandwidth() / 2 + 4)
    .attr('fill', '#94a3b8')
    .style('font-size', '11px')
    .text(d => (+d.hdi).toFixed(3));

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5))
    .selectAll('text').attr('fill', '#94a3b8');

  svg.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .attr('fill', '#94a3b8')
    .style('font-size', '11px');
}