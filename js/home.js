const tooltip = d3.select('.tooltip');

// ── Counter Animation ──
function animateCounter(id, target, prefix = '', suffix = '') {
  const el = document.getElementById(id);
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

// ── Load all data ──
Promise.all([
  d3.csv('data/population.csv'),
  d3.csv('data/economy.csv'),
  d3.csv('data/education.csv'),
  d3.csv('data/health.csv'),
  d3.csv('data/hdi_clean.csv'),
  d3.json('https://raw.githubusercontent.com/AKMalkani/pakistan-geojson/master/pakistan.geojson')
]).then(function([popData, econData, eduData, healthData, hdiData, geoData]) {

  // ── KPI: Population ──
  const popRow = popData.filter(d => d.indicator_code === 'SP.POP.TOTL');
  const latestPop = popRow.sort((a, b) => b.year - a.year)[0];
  const popM = Math.round(+latestPop.value / 1e6);
  animateCounter('kpi-population', popM, '', 'M');

  // ── KPI: GDP ──
  const gdpRow = econData.filter(d => d.indicator_code === 'NY.GDP.MKTP.CD');
  const latestGdp = gdpRow.sort((a, b) => b.year - a.year)[0];
  const gdpB = Math.round(+latestGdp.value / 1e9);
  animateCounter('kpi-gdp', gdpB, '$', 'B');

  // ── KPI: Literacy (female + male average) ──
  const litF = eduData.filter(d => d.indicator_code === 'SE.ADT.LITR.FE.ZS')
    .sort((a, b) => b.year - a.year)[0];
  const litM = eduData.filter(d => d.indicator_code === 'SE.ADT.LITR.MA.ZS')
    .sort((a, b) => b.year - a.year)[0];
  const avgLit = Math.round((+litF.value + +litM.value) / 2);
  animateCounter('kpi-literacy', avgLit, '', '%');

  // ── KPI: Life Expectancy ──
  const lifeRow = healthData.filter(d => d.indicator_code === 'SP.DYN.LE00.IN');
  const latestLife = lifeRow.sort((a, b) => b.year - a.year)[0];
  const lifeVal = Math.round(+latestLife.value);
  animateCounter('kpi-life', lifeVal, '', ' yrs');

  // ── MAP ──
  const width = 620, height = 520;

  const svg = d3.select('#pakistan-map')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const colorScale = d3.scaleSequential()
    .domain([0.38, 0.70])
    .interpolator(d3.interpolateGreens);

  const latestYear = d3.max(hdiData, d => +d.year);
  const hdiMap = {};
  hdiData
    .filter(d => +d.year === latestYear)
    .forEach(d => { hdiMap[d.Region.trim()] = +d.hdi; });

  const projection = d3.geoMercator()
    .fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);

  svg.selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', d => {
      const name = d.properties.NAME_1 || d.properties.name;
      return hdiMap[name] ? colorScale(hdiMap[name]) : '#334155';
    })
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 1.5)
    .on('mouseover', function(event, d) {
      const name = d.properties.NAME_1 || d.properties.name;
      const hdi = hdiMap[name];
      d3.select(this).attr('stroke', '#22c55e').attr('stroke-width', 2.5);
      tooltip.style('opacity', 1)
        .html(`<strong>${name}</strong><br/>HDI (${latestYear}): ${hdi ? hdi.toFixed(3) : 'N/A'}`);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).attr('stroke', '#0f172a').attr('stroke-width', 1.5);
      tooltip.style('opacity', 0);
    });

  // ── Legend ──
  const legendWidth = 200;
  const legendSvg = d3.select('#pakistan-map')
    .append('svg')
    .attr('width', legendWidth + 40)
    .attr('height', 50)
    .style('display', 'block')
    .style('margin', '10px auto');

  const defs = legendSvg.append('defs');
  const grad = defs.append('linearGradient').attr('id', 'legend-gradient');
  grad.selectAll('stop')
    .data([
      { offset: '0%',   color: colorScale(0.38) },
      { offset: '100%', color: colorScale(0.70) }
    ])
    .enter().append('stop')
    .attr('offset', d => d.offset)
    .attr('stop-color', d => d.color);

  legendSvg.append('rect')
    .attr('x', 20).attr('y', 10)
    .attr('width', legendWidth).attr('height', 12)
    .style('fill', 'url(#legend-gradient)').attr('rx', 4);

  legendSvg.append('text').attr('x', 20).attr('y', 35)
    .attr('fill', '#94a3b8').style('font-size', '11px').text('Low HDI');
  legendSvg.append('text').attr('x', legendWidth + 20).attr('y', 35)
    .attr('fill', '#94a3b8').attr('text-anchor', 'end')
    .style('font-size', '11px').text('High HDI');

}).catch(err => console.error('Data load error:', err));const tooltip = d3.select('.tooltip');

// ── Counter Animation ──
function animateCounter(id, target, prefix = '', suffix = '') {
  const el = document.getElementById(id);
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

// ── Load all data ──
Promise.all([
  d3.csv('data/population.csv'),
  d3.csv('data/economy.csv'),
  d3.csv('data/education.csv'),
  d3.csv('data/health.csv'),
  d3.csv('data/hdi_clean.csv'),
  d3.json('https://raw.githubusercontent.com/AKMalkani/pakistan-geojson/master/pakistan.geojson')
]).then(function([popData, econData, eduData, healthData, hdiData, geoData]) {

  // ── KPI: Population ──
  const popRow = popData.filter(d => d.indicator_code === 'SP.POP.TOTL');
  const latestPop = popRow.sort((a, b) => b.year - a.year)[0];
  const popM = Math.round(+latestPop.value / 1e6);
  animateCounter('kpi-population', popM, '', 'M');

  // ── KPI: GDP ──
  const gdpRow = econData.filter(d => d.indicator_code === 'NY.GDP.MKTP.CD');
  const latestGdp = gdpRow.sort((a, b) => b.year - a.year)[0];
  const gdpB = Math.round(+latestGdp.value / 1e9);
  animateCounter('kpi-gdp', gdpB, '$', 'B');

  // ── KPI: Literacy (female + male average) ──
  const litF = eduData.filter(d => d.indicator_code === 'SE.ADT.LITR.FE.ZS')
    .sort((a, b) => b.year - a.year)[0];
  const litM = eduData.filter(d => d.indicator_code === 'SE.ADT.LITR.MA.ZS')
    .sort((a, b) => b.year - a.year)[0];
  const avgLit = Math.round((+litF.value + +litM.value) / 2);
  animateCounter('kpi-literacy', avgLit, '', '%');

  // ── KPI: Life Expectancy ──
  const lifeRow = healthData.filter(d => d.indicator_code === 'SP.DYN.LE00.IN');
  const latestLife = lifeRow.sort((a, b) => b.year - a.year)[0];
  const lifeVal = Math.round(+latestLife.value);
  animateCounter('kpi-life', lifeVal, '', ' yrs');

  // ── MAP ──
  const width = 620, height = 520;

  const svg = d3.select('#pakistan-map')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const colorScale = d3.scaleSequential()
    .domain([0.38, 0.70])
    .interpolator(d3.interpolateGreens);

  const latestYear = d3.max(hdiData, d => +d.year);
  const hdiMap = {};
  hdiData
    .filter(d => +d.year === latestYear)
    .forEach(d => { hdiMap[d.Region.trim()] = +d.hdi; });

  const projection = d3.geoMercator()
    .fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);

  svg.selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', d => {
      const name = d.properties.NAME_1 || d.properties.name;
      return hdiMap[name] ? colorScale(hdiMap[name]) : '#334155';
    })
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 1.5)
    .on('mouseover', function(event, d) {
      const name = d.properties.NAME_1 || d.properties.name;
      const hdi = hdiMap[name];
      d3.select(this).attr('stroke', '#22c55e').attr('stroke-width', 2.5);
      tooltip.style('opacity', 1)
        .html(`<strong>${name}</strong><br/>HDI (${latestYear}): ${hdi ? hdi.toFixed(3) : 'N/A'}`);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).attr('stroke', '#0f172a').attr('stroke-width', 1.5);
      tooltip.style('opacity', 0);
    });

  // ── Legend ──
  const legendWidth = 200;
  const legendSvg = d3.select('#pakistan-map')
    .append('svg')
    .attr('width', legendWidth + 40)
    .attr('height', 50)
    .style('display', 'block')
    .style('margin', '10px auto');

  const defs = legendSvg.append('defs');
  const grad = defs.append('linearGradient').attr('id', 'legend-gradient');
  grad.selectAll('stop')
    .data([
      { offset: '0%',   color: colorScale(0.38) },
      { offset: '100%', color: colorScale(0.70) }
    ])
    .enter().append('stop')
    .attr('offset', d => d.offset)
    .attr('stop-color', d => d.color);

  legendSvg.append('rect')
    .attr('x', 20).attr('y', 10)
    .attr('width', legendWidth).attr('height', 12)
    .style('fill', 'url(#legend-gradient)').attr('rx', 4);

  legendSvg.append('text').attr('x', 20).attr('y', 35)
    .attr('fill', '#94a3b8').style('font-size', '11px').text('Low HDI');
  legendSvg.append('text').attr('x', legendWidth + 20).attr('y', 35)
    .attr('fill', '#94a3b8').attr('text-anchor', 'end')
    .style('font-size', '11px').text('High HDI');

}).catch(err => console.error('Data load error:', err));const tooltip = d3.select('.tooltip');

// ── Counter Animation ──
function animateCounter(id, target, prefix = '', suffix = '') {
  const el = document.getElementById(id);
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

// ── Load all data ──
Promise.all([
  d3.csv('data/population.csv'),
  d3.csv('data/economy.csv'),
  d3.csv('data/education.csv'),
  d3.csv('data/health.csv'),
  d3.csv('data/hdi_clean.csv'),
  d3.json('https://raw.githubusercontent.com/AKMalkani/pakistan-geojson/master/pakistan.geojson')
]).then(function([popData, econData, eduData, healthData, hdiData, geoData]) {

  // ── KPI: Population ──
  const popRow = popData.filter(d => d.indicator_code === 'SP.POP.TOTL');
  const latestPop = popRow.sort((a, b) => b.year - a.year)[0];
  const popM = Math.round(+latestPop.value / 1e6);
  animateCounter('kpi-population', popM, '', 'M');

  // ── KPI: GDP ──
  const gdpRow = econData.filter(d => d.indicator_code === 'NY.GDP.MKTP.CD');
  const latestGdp = gdpRow.sort((a, b) => b.year - a.year)[0];
  const gdpB = Math.round(+latestGdp.value / 1e9);
  animateCounter('kpi-gdp', gdpB, '$', 'B');

  // ── KPI: Literacy (female + male average) ──
  const litF = eduData.filter(d => d.indicator_code === 'SE.ADT.LITR.FE.ZS')
    .sort((a, b) => b.year - a.year)[0];
  const litM = eduData.filter(d => d.indicator_code === 'SE.ADT.LITR.MA.ZS')
    .sort((a, b) => b.year - a.year)[0];
  const avgLit = Math.round((+litF.value + +litM.value) / 2);
  animateCounter('kpi-literacy', avgLit, '', '%');

  // ── KPI: Life Expectancy ──
  const lifeRow = healthData.filter(d => d.indicator_code === 'SP.DYN.LE00.IN');
  const latestLife = lifeRow.sort((a, b) => b.year - a.year)[0];
  const lifeVal = Math.round(+latestLife.value);
  animateCounter('kpi-life', lifeVal, '', ' yrs');

  // ── MAP ──
  const width = 620, height = 520;

  const svg = d3.select('#pakistan-map')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const colorScale = d3.scaleSequential()
    .domain([0.38, 0.70])
    .interpolator(d3.interpolateGreens);

  const latestYear = d3.max(hdiData, d => +d.year);
  const hdiMap = {};
  hdiData
    .filter(d => +d.year === latestYear)
    .forEach(d => { hdiMap[d.Region.trim()] = +d.hdi; });

  const projection = d3.geoMercator()
    .fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);

  svg.selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', d => {
      const name = d.properties.NAME_1 || d.properties.name;
      return hdiMap[name] ? colorScale(hdiMap[name]) : '#334155';
    })
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 1.5)
    .on('mouseover', function(event, d) {
      const name = d.properties.NAME_1 || d.properties.name;
      const hdi = hdiMap[name];
      d3.select(this).attr('stroke', '#22c55e').attr('stroke-width', 2.5);
      tooltip.style('opacity', 1)
        .html(`<strong>${name}</strong><br/>HDI (${latestYear}): ${hdi ? hdi.toFixed(3) : 'N/A'}`);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).attr('stroke', '#0f172a').attr('stroke-width', 1.5);
      tooltip.style('opacity', 0);
    });

  // ── Legend ──
  const legendWidth = 200;
  const legendSvg = d3.select('#pakistan-map')
    .append('svg')
    .attr('width', legendWidth + 40)
    .attr('height', 50)
    .style('display', 'block')
    .style('margin', '10px auto');

  const defs = legendSvg.append('defs');
  const grad = defs.append('linearGradient').attr('id', 'legend-gradient');
  grad.selectAll('stop')
    .data([
      { offset: '0%',   color: colorScale(0.38) },
      { offset: '100%', color: colorScale(0.70) }
    ])
    .enter().append('stop')
    .attr('offset', d => d.offset)
    .attr('stop-color', d => d.color);

  legendSvg.append('rect')
    .attr('x', 20).attr('y', 10)
    .attr('width', legendWidth).attr('height', 12)
    .style('fill', 'url(#legend-gradient)').attr('rx', 4);

  legendSvg.append('text').attr('x', 20).attr('y', 35)
    .attr('fill', '#94a3b8').style('font-size', '11px').text('Low HDI');
  legendSvg.append('text').attr('x', legendWidth + 20).attr('y', 35)
    .attr('fill', '#94a3b8').attr('text-anchor', 'end')
    .style('font-size', '11px').text('High HDI');

}).catch(err => console.error('Data load error:', err));