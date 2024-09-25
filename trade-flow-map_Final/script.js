// Set dimensions and create SVG container
const width = 1920, height = 1080;
const svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height)
    .style('display', 'block')  // Ensures SVG centers in its container
    .style('margin', 'auto');   // Automatically center the SVG

// Create a group for all content to make zooming easier
const g = svg.append('g');

// Define the zoom behavior and apply it to the SVG
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });
svg.call(zoom);

// Define a Mercator projection
const projection = d3.geoMercator()
    .scale(200) // You may need to adjust this scale
    .translate([width / 2, height / 2]); // Ensure the map centers in the SVG

const pathGenerator = d3.geoPath().projection(projection);

// Remaining part of the script continues here...


// Define arrow marker for the lines
svg.append('defs').append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 5)
    .attr('refY', 0)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'blue');

// Continent color mapping
const continentColors = {
    'Africa': '#cf10ff',
    'Asia': 'yellow',
    'Europe': '#12f712',
    'Oceania': '#18fffb',
    'North America': 'orange',
    'South America': '#456A91'
};

// Load geographic and CSV data
Promise.all([
    d3.json('world-geo1.json'),  // Ensure your JSON file is correctly formatted and accessible
    d3.csv('all.csv')            // Ensure CSV file includes continent data and is correctly formatted
]).then(([geoData, tradeData]) => {
    const involvedCountries = new Set(tradeData.flatMap(d => [d.Source, d.Target]));

    // Draw the base world map
    g.selectAll('path')
        .data(geoData.features)
        .enter().append('path')
        .attr('d', pathGenerator)
        .attr('fill', '#ccc');  // Neutral color for the base map

    // Prepare trade links data
    const links = tradeData.map(d => {
        const source = geoData.features.find(c => c.properties.name === d.Source);
        const target = geoData.features.find(c => c.properties.name === d.Target);
        if (source && target) {
            return {
                source: source.properties.name,
                target: target.properties.name,
                sourceCoords: projection(d3.geoCentroid(source)),
                targetCoords: projection(d3.geoCentroid(target)),
                value: +d.Total
            };
        }
        return null;
    }).filter(d => d);  // Ensure both source and target are found

    const scale = d3.scaleLinear()
        .domain(d3.extent(links.map(d => d.value)))
        .range([0.5, 5]);

    const linkGroup = g.append('g').attr('class', 'links');
    const allLinks = linkGroup.selectAll('path')
        .data(links)
        .enter().append('path')
        .attr('d', d => `M${d.sourceCoords[0]} ${d.sourceCoords[1]} Q${(d.sourceCoords[0] + d.targetCoords[0]) / 2} ${(d.sourceCoords[1] + d.targetCoords[1]) / 2 - 50} ${d.targetCoords[0]} ${d.targetCoords[1]}`)
        .attr('stroke-width', d => scale(d.value))
        .attr('stroke', 'blue')
        .attr('fill', 'none')
        .attr('opacity', 0.6)
        .attr('marker-end', 'url(#arrow)');

    // Adding nodes (countries) on the map
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodes = nodeGroup.selectAll('circle')
        .data(geoData.features.filter(d => involvedCountries.has(d.properties.name)))
        .enter().append('circle')
        .attr('cx', d => projection(d3.geoCentroid(d))[0])
        .attr('cy', d => projection(d3.geoCentroid(d))[1])
        .attr('r', 5)
        .attr('fill', d => continentColors[d.properties.continent] || 'grey');  // Apply colors based on continents

    // Adding labels (country names)
    const labels = nodeGroup.selectAll('text')
        .data(geoData.features.filter(d => involvedCountries.has(d.properties.name)))
        .enter().append('text')
        .attr('x', d => projection(d3.geoCentroid(d))[0])
        .attr('y', d => projection(d3.geoCentroid(d))[1] - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text(d => d.properties.name)
        .on('click', function(event, d) {
            const activeCountry = d.properties.name;
            allLinks.style('opacity', 0)
                .filter(link => link.source === activeCountry || link.target === activeCountry)
                .style('opacity', 0.6);
            labels.style('opacity', 0.3);
            d3.select(this).style('opacity', 1);
        });

    // Right-click to reset the visibility of all links
    svg.on('contextmenu', function(event) {
        event.preventDefault();
        allLinks.style('opacity', 0.6);
        labels.style('opacity', 1);
    });

    // Creating a legend for the continent colors
    const legend = svg.append('g')
        .attr('transform', 'translate(20, 40)');  // Adjust position as needed

    Object.entries(continentColors).forEach(([continent, color], i) => {
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', i * 20)
            .attr('r', 10)
            .attr('fill', color);

        legend.append('text')
            .attr('x', 20)
            .attr('y', i * 20 + 5)
            .text(continent)
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');
    });

           
  
}).catch(err => console.error('Error loading or processing data:', err));
