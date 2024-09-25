



const continentColors = {
    'Africa': '#cf10ff',
    'Asia': 'yellow',
    'Europe': '#12f712',
    'Oceania': '#18fffb',
    'North America': 'orange',
    'South America': '#456A91',
};





d3.csv("all10.csv").then(function(data) {
    var continentMap = {};
    data.forEach(function(d) {
        if (!continentMap[d.Source]) continentMap[d.Source] = d.Continent;
        // if (!continentMap[d.Target]) continentMap[d.Target] = d.Continent;
    });
    var nodes = d3.set(data.map(function(d) { return d.Source; }).concat(data.map(function(d) { return d.Target; }))).values().map(function(d) { 
        return {id: d, continent: continentMap[d]}; 
    });
    var links = data.map(function(d) { return {source: d.Source, target: d.Target, value: {export: +d.Export, emport: +d.Import}}; });
    var exportLinks = data.map(function(d) {return {source: d.Source, target: d.Target, value: +d.Export}; });
    var importLinks = data.map(function(d) {return {source: d.Target, target: d.Source, value: +d.Import};});
    
    var width = 800, height = 550;
    var svg =  d3.select("body").append("svg") 
        .attr("width", width)
        .attr("height", height);

    // Red arrow for imports
    // svg.append("defs").append("marker")
    //     .attr("id", "importArrow")
    //     .attr("viewBox", "0 -0 10 10")
    //     .attr("refX",20)
    //     .attr("refY", 0)
    //     .attr("markerWidth", 2)
    //     .attr("markerHeight", 2)
    //     .attr("orient", "auto")
    //     .append("path")
    //     .attr("d", "M0,-5L10,0L0,5")
    //     .attr("opacity", 0.75)
    //     .attr("fill", "red");

    

    svg.append("defs").append("marker")
        .attr("id", "importArrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "red");

    // Blue arrow for exports
    // svg.append("defs").append("marker")
    //     .attr("id", "exportArrow")
    //     .attr("viewBox", "0 -0 10 10")
    //     .attr("refX",25)
    //     .attr("refY", 0)
    //     .attr("markerWidth", 2)
    //     .attr("markerHeight", 2)
    //     .attr("orient", "auto")
    //     .append("path")
    //     .attr("opacity", 0.75)
    //     .attr("d", "M0,-5L10,0L0,5")
    //     .attr("fill", "blue");
    svg.append("defs").append("marker")
        .attr("id", "exportArrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "blue");


    
  

    var simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(function(d) { return d.id; }).strength(0.85))
        .force("charge", d3.forceManyBody(links).strength(-3500))
        .force("center", d3.forceCenter(width , height/1.38 ));


    // var simulation = d3.forceSimulation()
    //     .force("link", d3.forceLink().id(function(d) { return d.id; }))
    //     .force("charge", d3.forceManyBody().strength(-800))
    //     .force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2));



    simulation.force("link").distance(150).links([...importLinks, ...exportLinks]);
   

    simulation.nodes(nodes).on("tick", ticked);

    var strokeWidthScale = d3.scaleLinear()
        .domain([
            d3.min([d3.min(importLinks, function(d) { return d.value; }), d3.min(exportLinks, function(d) { return d.value; })]),
            d3.max([d3.max(importLinks, function(d) { return d.value; }), d3.max(exportLinks, function(d) { return d.value; })])
        ])
        .range([1, 5]);

    var importLink = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(importLinks)
        .enter().append("path")
        .attr("stroke", "red")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", function(d) { return strokeWidthScale(d.value); })
        .attr("marker-end", "url(#importArrow)")
        .attr("fill", "none");

    importLink.append("title")
        .text(function(d) { return "" + d.value; });

    var exportLink = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(exportLinks)
        .enter().append("path")
        .attr("stroke", "blue")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", function(d) { return strokeWidthScale(d.value ); })
        .attr("marker-end", "url(#exportArrow)")
        .attr("fill", "none");

    exportLink.append("title")
        .text(function(d) { return "" + d.value; });



        
    var selectedNode = null;

    var arc = d3.arc();
    var pie = d3.pie()
        .value(function(d) { return d.value; })
        .sort(null);

    nodes.forEach(node => {
        node.totalExport = 0;
        node.totalImport = 0;
        exportLinks.forEach(link => {
            let sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            if (sourceId === node.id) node.totalExport += Number(link.value);
        });
        importLinks.forEach(link => {
            let targetId = typeof link.target === 'object' ? link.target.id : link.target;
            if (targetId === node.id) node.totalImport += Number(link.value);
        });
        node.totalTrade = node.totalImport + node.totalExport;
        node.importPercentage = node.totalTrade > 0 ? (node.totalImport / node.totalTrade) * 100 : 0;
        node.exportPercentage = node.totalTrade > 0 ? (node.totalExport / node.totalTrade) * 100 : 0;
    });
    


    // Define the color scale after calculating totalTrade for each node
    var totalTradeExtent = d3.extent(nodes, function(d) { return d.totalTrade; });
    var colorScale = d3.scaleSequential(d3.interpolateGreens).domain(totalTradeExtent);
    // var colorScale = d3.scaleSequential(d3.interpolateBlues)
    // .domain(d3.min(nodes, function(d) { return d.totalTrade; }),
    // d3.max(nodes, function(d) { return d.totalTrade; }));
   






    var nodeSizeScale = d3.scaleLinear()
        .domain([
            d3.min(nodes, function(d) { return d.totalTrade; }),
            d3.max(nodes, function(d) { return d.totalTrade; })
        ])
        .range([5, 20]); // Adjust the range for node size

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on('click', function(d) {
            if (selectedNode === d) {
                selectedNode = null;
                node.style('fill', '#ddd');
                importLink.style('stroke', 'red');
                exportLink.style('stroke', 'blue');
            } else {
                selectedNode = d;
                node.style('fill', function(o) {
                    return isConnected(d, o, importLinks, exportLinks) ? 'skyblue' : '#ddd';
                });
                importLink.style('stroke', function(o) {
                    return o.target === d ? 'red' : 'none';
                }).style('marker-end', function(o) {
                    return o.target === d ? 'url(#importArrow)' : 'none';
                });
                exportLink.style('stroke', function(o) {
                    return o.source === d ? 'blue' : 'none';
                }).style('marker-end', function(o) {
                    return o.source === d ? 'url(#exportArrow)' : 'none';
                });
            }
        });

    

    node.append("circle")
        .attr("r", function(d) { return nodeSizeScale(d.totalTrade); })
        // .attr("fill", function(d) { return colorScale(d.totalTrade); });
        .attr("fill", function(d) { return continentColors[d.continent]; });


    node.color = continentColors[node.continent] || 'gray';

    node.each(function(d) {
        var g = d3.select(this);
        var donutData = [
            { type: 'import', value: d.importPercentage },
            { type: 'export', value: d.exportPercentage }
        ];

        var radius = nodeSizeScale(d.totalTrade);
        var arcGenerator = d3.arc()
            .innerRadius(radius * 0.8) // Inner radius of the donut chart
            .outerRadius(radius); // Outer radius of the donut chart

        var arcs = g.selectAll(".arc")
            .data(pie(donutData))
            .enter().append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arcGenerator)
            .attr("fill", function(d) {
                return d.data.type === 'import' ? 'red' : 'blue';
            });

        arcs.append("text")
            .attr("transform", function(d) {
                var centroid = arcGenerator.centroid(d);
                var offset = 13;
                var x = centroid[0];
                var y = centroid[1];
                var magnitude = Math.sqrt(x * x + y * y);
                x = x / magnitude * offset + x;
                y = y / magnitude * offset + y;
                return "translate(" + x + "," + y + ")";
            })
            .attr("dy", ".34em")
            .style("text-anchor", "middle")
            .style("font-size", "7px")
            .style("fill", "black");
            //.text(function(d) {return d.data.value.toFixed(1) + "%";});  //percentage 
    });

    // var labels = svg.append("g")
    //     .attr("class", "labels")
    //     .selectAll("text")
    //     .data(nodes)
    //     .enter().append("text")
    //     .attr("class", "label")
    //     .style("font-size", "5px")
    //     .attr("dx", -6)
    //     .attr("dy", ".35em")
    //     .text(function(d) { return d.id; });

    node.append("title")
        .text(function(d) { return d.id; });

    // simulation
    //     .nodes(nodes)
    //     .on("tick", ticked);

    // simulation.force("link")
    //     .distance(50)
    //     .links([...importLinks, ...exportLinks]);

    function ticked() {
        const offset = 30;

        importLink.attr("d", function(d) {
            return "M" + d.source.x + "," + d.source.y
                + " Q" + ((d.source.x + (d.target.x )) / 2 + 20) + "," + ((d.source.y + d.target.y) / 2 - 20)
                + " " + d.target.x + "," + d.target.y;
        });

        exportLink.attr("d", function(d) {
            return "M" + d.source.x + "," + d.source.y
                + " Q" + ((d.source.x + d.target.x) / 2 - 20) + "," + ((d.source.y + d.target.y) / 2 + 20  )
                + " " + d.target.x + "," + d.target.y;
        });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        // labels.attr("x", function(d) { return d.x; })
        //     .attr("y", function(d) { return d.y; });
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.01).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0.0);
        d.fx = null;
        d.fy = null;
    }

    function isConnected(a, b, importLinks, exportLinks) {
        const isImportConnected = importLinks.some(link => link.source.id === b.id && link.target.id === a.id);
        const isExportConnected = exportLinks.some(link => link.source.id === a.id && link.target.id === b.id);
        return isImportConnected || isExportConnected;
    }

/// Legend for node size

// 1. Define Legend Data
// Create a range of values for the legend. Adjust the count for more or fewer steps.
    const legendData = nodeSizeScale.ticks(5).map(value => ({
        value,
        size: nodeSizeScale(value)
    }));
    
  // 2. Create Legend Group
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(20,20)"); // Adjust this to position the legend near your plot
  
// Draw Legend Items based on size
    legend.selectAll("circle")
        .data(legendData)
        .enter().append("circle")
        .attr("cx", (d, i) => 10) // Set the x-coordinate of the circle's center; adjust as needed
        .attr("cy", (d, i) => i * 35 + 10) // Set the y-coordinate of the circle's center; adjust spacing as needed
        .attr("r", d => d.size)
        .style("fill", "gray");
  
// Adjust Text Labels to match size-based positioning
    legend.selectAll("text")
    .data(legendData)
    .enter().append("text")
        .attr("x", d => d.size + 16) // Adjust x position based on size
        .attr("y", (d, i) => i * 35 + 15) // Adjust y position to align with rectangles
        .attr("dy", "0.35em")
        .text(d => d.value);

    // labelYPosition = len(legendData) * 23 -50 

    legend.append("text")
         .attr("x", 0)  // Align with the left edge of the legend items
          .attr("y", 195)
          .text("Total Trade in Billion Dollar")  // Replace with your actual label text
          .attr("class", "legend-label")  // Optional: for styling via CSS



/// Legend for import and export
        
        
        // Step 2: Add Legend Items
        // Export Line
        legend.append("line")
          .attr("x1", 0)
          .attr("y1", 400)
          .attr("x2", 40) // Length of the line
          .attr("y2", 400)
          .attr("stroke", "blue")
          .attr("stroke-width", 2);
        
        // Export Label
        legend.append("text")
          .attr("x", 50) // Position text to the right of the line
          .attr("y", 400)
          .attr("dy", "0.32em") // Vertically align text
          .text("Export");
        
        // Import Line
        legend.append("line")
          .attr("x1", 0)
          .attr("y1", 400+20) // Position below the export line
          .attr("x2", 40) // Length of the line
          .attr("y2", 400+20)
          .attr("stroke", "red")
          .attr("stroke-width", 2);
        
        // Import Label
        legend.append("text")
          .attr("x", 50) // Position text to the right of the line
          .attr("y", 20) // Align with the import line
          .attr("y", 400+20)
          .attr("dy", "0.32em") // Vertically align text
          .text("Import");




/// Legend for continent

        // Assuming you have a continent to color mapping
        const continentColorMapping = [
            { continent:'Africa', color: '#cf10ff' },
            { continent: 'Asia', color: 'yellow' },
            { continent: 'Europe', color: '#12f712' },
            { continent: 'Oceania', color: '#18fffb' },
            { continent: 'America', color: 'orange' },
            { continent:'South America',color: '#456A91'},
           ,
        ];

                // Calculate starting position for the continent legend
        let legendYStart = 240; // Adjust based on your existing legend's size

        // Create Legend Items for Each Continent
        continentColorMapping.forEach((mapping, index) => {
        // Draw Legend Symbol (Circle)
        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", legendYStart + index * 25) // Adjust spacing as needed
            .attr("r", 5)
            .style("fill", mapping.color);

        // Add Legend Text
        legend.append("text")
            .attr("x", 20) // Position text to the right of the circle
            .attr("y", legendYStart + index * 25)
            .attr("dy", "0.32em") // Vertically align text
            .text(mapping.continent);
        });








});
