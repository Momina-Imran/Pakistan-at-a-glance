// KPI Counter Animation
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

// Run counters on page load
animateCounter('kpi-population', 231, '', 'M');
animateCounter('kpi-gdp', 341, '$', 'B');
animateCounter('kpi-literacy', 58, '', '%');
animateCounter('kpi-life', 67, '', '');

// Pakistan Map using D3
const width = 600, height = 500;

const svg = d3.select('#pakistan-map')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip');

// Province data (HDI placeholder values)
const provinceData = {
  'Punjab':      { hdi: 0.57, capital: 'Lahore' },
  'Sindh':       { hdi: 0.52, capital: 'Karachi' },
  'KPK':         { hdi: 0.49, capital: 'Peshawar' },
  'Balochistan': { hdi: 0.43, capital: 'Quetta' },
  'Islamabad':   { hdi: 0.69, capital: 'Islamabad' },
};

const colorScale = d3.scaleSequential()
  .domain([0.40, 0.75])
  .interpolator(d3.interpolateGreens);

// Load GeoJSON
d3.json('https://raw.githubusercontent.com/AKMalkani/pakistan-geojson/master/pakistan.geojson')
  .then(function(data) {

    const projection = d3.geoMercator()
      .fitSize([width, height], data);

    const path = d3.geoPath().projection(projection);

    svg.selectAll('path')
      .data(data.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', d => {
        const name = d.properties.NAME_1 || d.properties.name;
        const match = provinceData[name];
        return match ? colorScale(match.hdi) : '#334155';
      })
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5)
      .on('mouseover', function(event, d) {
        const name = d.properties.NAME_1 || d.properties.name;
        const info = provinceData[name];
        d3.select(this).attr('stroke', '#22c55e').attr('stroke-width', 2.5);
        tooltip
          .style('opacity', 1)
          .html(`<strong>${name}</strong><br/>HDI: ${info ? info.hdi : 'N/A'}`);
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
  })
  .catch(err => console.error('Map load error:', err));