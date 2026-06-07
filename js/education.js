const tooltip = d3.select('.tooltip');
const margin = { top: 20, right: 30, bottom: 40, left: 60 };

d3.csv('data/education.csv').then(function(data) {

  // ── Parse ──
  const litF = data
    .filter(d => d.indicator_code === 'SE.ADT.LITR.FE.ZS' && !isNaN(+d.value))
    .map(d => ({ year: +d.year, value: +d.value }))
    .sort((a, b) => a.year - b.year);

  const litM = data
    .filter(d => d.indicator_code === 'SE.ADT.LITR.MA.ZS' && !isNaN(+d.value))
    .map(d => ({ year: +d.year, value: +d.value }))
    .sort((a, b) => a.year - b.year);

  const primary = data
    .filter(d => d.indicator_code === 'SE.PRM.ENRR' && !isNaN(+d.value))
    .map(d => ({ year: +d.year, value: +d.value }))
    .sort((a, b) => a.year - b.year);

  const secondary = data
    .filter(d => d.indicator_code === 'SE.SEC.ENRR' && !isNaN(+d.value))
    .map(d => ({ year: +d.year, value: +d.value }))
    .sort((a, b) => a.year - b.year);

  drawLiteracyLines(litF, litM);
  drawGapChart(litF, litM);
  drawEnrollmentChart(primary, secondary);
  drawHeatmap(litF, litM);

}).catch(err => console.error('Error:', err));


// ── Chart 1: Literacy Lines ──
function drawLiteracyLines(litF, litM) {
  const container = document.getElementById('literacy-chart');
  const width  = container.offsetWidth - margin.left - margin.right;
  const height = 260 - margin.top - margin.bottom;

  const svg = d3.select('#literacy-chart')
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const allYears = [...new Set([...litF, ...litM].map(d => d.year))];
  const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, width]);
  const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

  // Grid
  svg.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
    .selectAll('line').attr('stroke', '#1e293b');
  svg.select('.grid .domain').remove();

  const lineGen = d3.line()
    .x(d => x(d.year)).y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  // Female line
  svg.append('path').datum(litF)
    .attr('fill', 'none').attr('stroke', '#f472b6')
    .attr('stroke-width', 2.5).attr('d', lineGen);

  // Male line
  svg.append('path').datum(litM)
    .attr('fill', 'none').attr('stroke', '#22c55e')
    .attr('stroke-width', 2.5).attr('d', lineGen);

  // Dots
  [{ data: litF, color: '#f472b6', label: 'Female' },
   { data: litM, color: '#22c55e', label: 'Male' }].forEach(({ data, color, label }) => {
    svg.selectAll(`.dot-${label}`)
      .data(data).enter().append('circle')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.value))
      .attr('r', 4).attr('fill', color)
      .on('mouseover', function(event, d) {
        tooltip.style('opacity', 1)
          .html(`<strong>${d.year}</strong><br/>${label}: ${d.value.toFixed(1)}%`);
      })
      .on('mousemove', function(event) {
        tooltip.style('left', (event.pageX + 12) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => tooltip.style('opacity', 0));
  });

  // Axes
  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#94a3b8');
  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
    .selectAll('text').attr('fill', '#94a3b8');

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${width - 120}, 10)`);
  [{ label: 'Male', color: '#22c55e' }, { label: 'Female', color: '#f472b6' }]
    .forEach(({ label, color }, i) => {
      legend.append('rect').attr('x', 0).attr('y', i * 20)
        .attr('width', 12).attr('height', 12).attr('fill', color).attr('rx', 2);
      legend.append('text').attr('x', 18).attr('y', i * 20 + 10)
        .attr('fill', '#94a3b8').style('font-size', '12px').text(label);
    });
}


// ── Chart 2: Gender Gap ──
function drawGapChart(litF, litM) {
  const container = document.getElementById('gap-chart');
  const width  = container.offsetWidth - margin.left - margin.right;
  const height = 260 - margin.top - margin.bottom;

  const commonYears = litF.map(f => f.year).filter(y => litM.find(m => m.year === y));
  const gapData = commonYears.map(yr => ({
    year: yr,
    gap: (litM.find(m => m.year === yr)?.value || 0) -
         (litF.find(f => f.year === yr)?.value || 0)
  }));

  const svg = d3.select('#gap-chart')
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(gapData.map(d => d.year))
    .range([0, width]).padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(gapData, d => d.gap) * 1.2])
    .range([height, 0]);

  svg.selectAll('rect')
    .data(gapData).enter().append('rect')
    .attr('x', d => x(d.year))
    .attr('y', d => y(d.gap))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.gap))
    .attr('fill', '#f59e0b').attr('rx', 3)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.year}</strong><br/>Gap: ${d.gap.toFixed(1)}%`);
    })
    .on('mousemove', function(event) {
      tooltip.style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#94a3b8').attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');
  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `${d.toFixed(0)}%`))
    .selectAll('text').attr('fill', '#94a3b8');
}


// ── Chart 3: Enrollment ──
function drawEnrollmentChart(primary, secondary) {
  const container = document.getElementById('enrollment-chart');
  const width  = container.offsetWidth - margin.left - margin.right;
  const height = 260 - margin.top - margin.bottom;

  const svg = d3.select('#enrollment-chart')
    .append('svg')
    .attr('width',  width  + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const allYears = [...new Set([...primary, ...secondary].map(d => d.year))];
  const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, width]);
  const y = d3.scaleLinear().domain([0, 110]).range([height, 0]);

  const lineGen = d3.line()
    .x(d => x(d.year)).y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  svg.append('path').datum(primary)
    .attr('fill', 'none').attr('stroke', '#22c55e')
    .attr('stroke-width', 2.5).attr('d', lineGen);
  svg.append('path').datum(secondary)
    .attr('fill', 'none').attr('stroke', '#818cf8')
    .attr('stroke-width', 2.5).attr('d', lineGen);

  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text').attr('fill', '#94a3b8');
  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
    .selectAll('text').attr('fill', '#94a3b8');

  const legend = svg.append('g').attr('transform', `translate(${width - 130}, 10)`);
  [{ label: 'Primary', color: '#22c55e' }, { label: 'Secondary', color: '#818cf8' }]
    .forEach(({ label, color }, i) => {
      legend.append('rect').attr('x', 0).attr('y', i * 20)
        .attr('width', 12).attr('height', 12).attr('fill', color).attr('rx', 2);
      legend.append('text').attr('x', 18).attr('y', i * 20 + 10)
        .attr('fill', '#94a3b8').style('font-size', '12px').text(label);
    });
}


// ── Chart 4: Heatmap (Green) ──
function drawHeatmap(litF, litM) {
  const container = document.getElementById('heatmap-chart');
  const w = container.offsetWidth - margin.left - 40;
  const categories = ['Male', 'Female'];
  const years = [...new Set([...litF, ...litM].map(d => d.year))].sort();

  const cellW = Math.floor(w / years.length);
  const cellH = 50;
  const height = categories.length * cellH;

  const svg = d3.select('#heatmap-chart')
    .append('svg')
    .attr('width',  w + margin.left + 40)
    .attr('height', height + margin.top + margin.bottom + 20)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Green color scale
  const allVals = [...litF, ...litM].map(d => d.value);
  const colorScale = d3.scaleSequential()
    .domain([d3.min(allVals), d3.max(allVals)])
    .interpolator(d3.interpolateGreens);

  const heatData = [];
  years.forEach(yr => {
    const fVal = litF.find(d => d.year === yr);
    const mVal = litM.find(d => d.year === yr);
    if (fVal) heatData.push({ year: yr, cat: 'Female', value: fVal.value });
    if (mVal) heatData.push({ year: yr, cat: 'Male',   value: mVal.value });
  });

  svg.selectAll('rect')
    .data(heatData).enter().append('rect')
    .attr('x', d => years.indexOf(d.year) * cellW)
    .attr('y', d => categories.indexOf(d.cat) * cellH)
    .attr('width', cellW - 2)
    .attr('height', cellH - 2)
    .attr('fill', d => colorScale(d.value))
    .attr('rx', 3)
    .on('mouseover', function(event, d) {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.cat} — ${d.year}</strong><br/>Literacy: ${d.value.toFixed(1)}%`);
    })
    .on('mousemove', function(event) {
      tooltip.style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  // Y labels
  categories.forEach((cat, i) => {
    svg.append('text')
      .attr('x', -8).attr('y', i * cellH + cellH / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#94a3b8').style('font-size', '12px').text(cat);
  });

  // X labels
  years.filter((_, i) => i % 3 === 0).forEach(yr => {
    svg.append('text')
      .attr('x', years.indexOf(yr) * cellW + cellW / 2)
      .attr('y', height + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8').style('font-size', '10px').text(yr);
  });
}