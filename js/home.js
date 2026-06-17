const tooltip = d3.select('.tooltip');
const margin = { top: 20, right: 30, bottom: 40, left: 140 };

function animateCounter(id, target, prefix = '', suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const duration = 1500;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = prefix + target + suffix;
      clearInterval(timer);
    } else {
      el.textContent = prefix + Math.floor(start) + suffix;
    }
  }, 16);
}

Promise.all([
  d3.csv('data/population.csv'),
  d3.csv('data/economy.csv'),
  d3.csv('data/education.csv'),
  d3.csv('data/health.csv'),
  d3.csv('data/hdi_clean.csv')
]).then(function([popData, econData, eduData, healthData, hdiData]) {

  // ── KPI: Population ──
  const popRows = popData
    .filter(d => d.indicator_code === 'SP.POP.TOTL' && !isNaN(+d.value))
    .sort((a, b) => +b.year - +a.year);
  if (popRows.length)
    animateCounter('kpi-population', Math.round(+popRows[0].value / 1e6), '', 'M');

  // ── KPI: GDP ──
  const gdpRows = econData
    .filter(d => d.indicator_code === 'NY.GDP.MKTP.CD' && !isNaN(+d.value))
    .sort((a, b) => +b.year - +a.year);
  if (gdpRows.length)
    animateCounter('kpi-gdp', Math.round(+gdpRows[0].value / 1e9), '$', 'B');

  // ── KPI: Literacy ──
  const litF = eduData
    .filter(d => d.indicator_code === 'SE.ADT.LITR.FE.ZS' && !isNaN(+d.value))
    .sort((a, b) => +b.year - +a.year);
  const litM = eduData
    .filter(d => d.indicator_code === 'SE.ADT.LITR.MA.ZS' && !isNaN(+d.value))
    .sort((a, b) => +b.year - +a.year);
  if (litF.length && litM.length)
    animateCounter('kpi-literacy', Math.round((+litF[0].value + +litM[0].value) / 2), '', '%');

  // ── KPI: Life Expectancy ──
  const lifeRows = healthData
    .filter(d => d.indicator_code === 'SP.DYN.LE00.IN' && !isNaN(+d.value))
    .sort((a, b) => +b.year - +a.year);
  if (lifeRows.length)
    animateCounter('kpi-life', Math.round(+lifeRows[0].value), '', ' yrs');

  // ── Chart 1: Province HDI Bar Chart ──
  const latestYear = d3.max(hdiData, d => +d.year);
  const provinceData = hdiData
    .filter(d => +d.year === latestYear && d.Region !== 'Total')
    .sort((a, b) => +b.hdi - +a.hdi);

  drawHDIBar(provinceData, latestYear);

  // ── Chart 2: National HDI Trend ──
  // Debug: dekho kya names hain
console.log('All regions:', [...new Set(hdiData.map(d => d.Region))]);

const nationalData = hdiData
  .filter(d => d.Region === 'Total' || 
               d.Region === 'PAKt' || 
               d.Region === 'Pakistan' ||
               d.Region === 'National')
    .map(d => ({ year: +d.year, hdi: +d.hdi }))
    .sort((a, b) => a.year - b.year);

  drawHDITrend(nationalData);

}).catch(err => console.error('Error:', err));


// ── Province HDI Horizontal Bar ──
function drawHDIBar(data, year) {
  const container = document.getElementById('hdi-province-bar');
  const width  = container.offsetWidth - margin.left - margin.right;
  const height = data.length * 40;

  const colorScale = d3.scaleSequential()
    .domain([0.38, 0.70])
    .interpolator(d3.interpolateGreens);

  const svg = d3.select('#hdi-province-bar')
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + 20)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 0.75]).range([0, width]);
  const y = d3.scaleBand()
    .domain(data.map(d => d.Region))
    .range([0, height])
    .padding(0.3);

  // Bars
  svg.selectAll('rect')
    .data(data).enter().append('rect')
    .attr('x', 0)
    .attr('y', d => y(d.Region))
    .attr('width', 0)
    .attr('height', y.bandwidth())
    .attr('fill', d => colorScale(+d.hdi))
    .attr('rx', 4)
    .transition().duration(800)
    .attr('width', d => x(+d.hdi));

  // Value labels
  svg.selectAll('.val-label')
    .data(data).enter().append('text')
    .attr('x', d => x(+d.hdi) + 6)
    .attr('y', d => y(d.Region) + y.bandwidth() / 2 + 4)
    .attr('fill', '#94a3b8')
    .style('font-size', '12px')
    .text(d => (+d.hdi).toFixed(3));

  // Mouseover on bars
  svg.selectAll('rect')
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.Region}</strong><br/>HDI (${year}): ${(+d.hdi).toFixed(3)}`);
    })
    .on('mousemove', function(event) {
      tooltip.style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // Y Axis
  svg.append('g').call(d3.axisLeft(y))
    .selectAll('text')
    .attr('fill', '#94a3b8')
    .style('font-size', '12px');

  // X Axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5))
    .selectAll('text').attr('fill', '#94a3b8');
}


// ── National HDI Trend Line ──
function drawHDITrend(data) {
  const m = { top: 20, right: 30, bottom: 40, left: 60 };
  const container = document.getElementById('hdi-trend-line');
  const width  = container.offsetWidth - m.left - m.right;
  const height = 300 - m.top - m.bottom;

  const svg = d3.select('#hdi-trend-line')
    .append('svg')
    .attr('width',  width  + m.left + m.right)
    .attr('height', height + m.top  + m.bottom)
    .append('g')
    .attr('transform', `translate(${m.left},${m.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year)).range([0, width]);
  const y = d3.scaleLinear()
    .domain([0.35, d3.max(data, d => d.hdi) * 1.05]).range([height, 0]);

  // Grid
  svg.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
    .selectAll('line').attr('stroke', '#1e293b');
  svg.select('.grid .domain').remove();

  // Area
  svg.append('path').datum(data)
    .attr('fill', '#22c55e').attr('opacity', 0.12)
    .attr('d', d3.area()
      .x(d => x(d.year)).y0(height).y1(d => y(d.hdi))
      .curve(d3.curveMonotoneX));

  // Line
  svg.append('path').datum(data)
    .attr('fill', 'none').attr('stroke', '#22c55e')
    .attr('stroke-width', 2.5)
    .attr('d', d3.line()
      .x(d => x(d.year)).y(d => y(d.hdi))
      .curve(d3.curveMonotoneX));

  // Dots
  svg.selectAll('circle').data(data).enter().append('circle')
    .attr('cx', d => x(d.year)).attr('cy', d => y(d.hdi))
    .attr('r', 3).attr('fill', '#22c55e')
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.year}</strong><br/>HDI: ${d.hdi.toFixed(3)}`);
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
    .call(d3.axisLeft(y).ticks(5))
    .selectAll('text').attr('fill', '#94a3b8');
}