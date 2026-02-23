let map;
let geojsonLayer;
let pollingPlacesLayer;
let turnoutData = {};
let selectedYear = '2024';
let vermontGeoJSONData = null;
let layersVisible = {
    turnout: true,
    pollingPlaces: true
};
let chartRenderCache = {};
let selectedMetric = 'australianBallotTurnout'; // Default metric

function zoomToTown(townName) {
    if (!vermontGeoJSONData) {
        alert('Town data is still loading. Please try again in a moment.');
        return;
    }
    const townFeature = vermontGeoJSONData.features.find(feature => {
        const name = feature.properties.TOWNNAMEMC || feature.properties.TOWNNAME || '';
        return name.toUpperCase() === townName.trim().toUpperCase();
    });
    if (townFeature) {
        const bounds = L.geoJSON(townFeature).getBounds();
        map.fitBounds(bounds, { maxZoom: 12 });
    } else {
        alert('Town not found. Please check the spelling and try again.');
    }
}
    
    

function initMap() {
    // Initialize map centered on Vermont
    map = L.map('map').setView([43.9, -72.5], 8);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 6
    }).addTo(map);

    // Add legend
    addLegend();
    
    // Add layer control
    addLayerControl();
    
    // Add metric selector
    addMetricSelector();

    // Load turnout data first, then Vermont towns GeoJSON
    loadTurnoutData();
}

function loadTurnoutData() {
    fetch('Data/Turnout Statistics/Combined/town-meeting-absentee-col-rm.csv')
        .then(response => response.text())
        .then(csvData => {
            parseTurnoutData(csvData);
            loadVermontGeoJSON();
        })
        .catch(error => {
            console.error('Error loading turnout data:', error);
            // Continue loading map without turnout data
            loadVermontGeoJSON();
        });
}

function parseTurnoutData(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const town = values[0]?.trim().toUpperCase();
        const year = values[3]?.trim();
        
        // Parse float values, handling empty strings
        const parseValue = (val) => {
            if (!val || val.trim() === '') return null;
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        };
        
        const floorVoteTurnout = parseValue(values[1]);
        const australianBallotTurnout = parseValue(values[2]);
        
        if (town && year) {
            const key = `${town}_${year}`;
            turnoutData[key] = {
                town: town,
                year: year,
                floorVoteTurnout: floorVoteTurnout,
                australianBallotTurnout: australianBallotTurnout
            };
        }
    }
    
    console.log('Loaded turnout data for', Object.keys(turnoutData).length, 'town-year combinations');
    console.log('Sample data:', Object.values(turnoutData).slice(0, 5));
    
    // Create average turnout chart
    createAvgTurnoutChart();
}

function loadVermontGeoJSON() {
    fetch('vermont-towns.geojson')
        .then(response => response.json())
        .then(data => {
            vermontGeoJSONData = data;
            renderGeoJSON();
            addYearControl();
            
            // Load polling places after GeoJSON is loaded
            loadPollingPlaces();
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
            // Fallback: show a message to user
            showErrorMessage('Unable to load town data. Please refresh the page.');
        });
}

function renderGeoJSON() {
    // Remove existing layer if present
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }
    
    geojsonLayer = L.geoJSON(vermontGeoJSONData, {
        style: getStyleForFeature,
        onEachFeature: onEachFeature
    });
    
    // Only add to map if visible
    if (layersVisible.turnout) {
        geojsonLayer.addTo(map);
    }
}

function getStyleForFeature(feature) {
    // Get town name and lookup turnout data
    const townName = (feature.properties.TOWNNAMEMC || feature.properties.TOWNNAME || '').toUpperCase();
    const key = `${townName}_${selectedYear}`;
    const data = turnoutData[key];
    
    let turnoutRate = null;
    if (data && data[selectedMetric] !== null) {
        // Convert from decimal to percentage (0.25 => 25)
        turnoutRate = data[selectedMetric] * 100;
    }
    
    let color;
    
    if (turnoutRate === null) {
        color = '#cccccc'; // Gray for no data
    } else if (turnoutRate >= 40) {
        color = '#1a5f3f'; // Dark green - high turnout
    } else if (turnoutRate >= 30) {
        color = '#2a7f5f'; // Medium green
    } else if (turnoutRate >= 20) {
        color = '#4ca87a'; // Light green
    } else if (turnoutRate >= 10) {
        color = '#f0ad4e'; // Amber - moderate
    } else {
        color = '#c9302c'; // Red - low turnout
    }

    return {
        fillColor: color,
        weight: 2,
        opacity: 0.8,
        color: '#ffffff',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function onEachFeature(feature, layer) {
    // Create popup content
    const props = feature.properties;
    const townName = props.TOWNNAMEMC || props.TOWNNAME || 'Unknown Town';
    const townKey = townName.toUpperCase();
    const key = `${townKey}_${selectedYear}`;
    const data = turnoutData[key];

    layer.on('click', function() {
        createTownTurnoutChart(townName);
        console.log(`Feature: ${townName}, Key: ${key}, Data:`, data);
    });
    
    let turnoutInfo = '<p><strong>Australian Ballot Turnout:</strong> No data</p>';
    if (data) {
        const turnoutPct = (data.australianBallotTurnout * 100).toFixed(1);
        turnoutInfo = `<p><strong>Australian Ballot Turnout:</strong> ${turnoutPct}%</p>`;
        
        if (data.floorVoteTurnout !== null) {
            const floorPct = (data.floorVoteTurnout * 100).toFixed(1);
            turnoutInfo += `<p><strong>Floor Vote Turnout:</strong> ${floorPct}%</p>`;
        }
    }

    // create variable to store total turnout of population, which is australian ballot turnout + floor vote turnout (if available)
    const totalTurnout = [data?.australianBallotTurnout, data?.floorVoteTurnout]
        .filter(v => v !== null)
        .reduce((sum, v) => sum + v, 0);
    
    if (totalTurnout > 0) {
        const totalPct = (totalTurnout * 100).toFixed(1);
        turnoutInfo += `<p><strong>Total Recorded Voter Turnout:</strong> ${totalPct}%</p>`;
    }
    
    const popupContent = `
        <div class="town-popup">
            <h3>${townName}</h3>
            <p><strong>Year:</strong> ${selectedYear}</p>
            ${turnoutInfo}
        </div>
    `;

    layer.bindPopup(popupContent);

    // Highlight feature on hover
    layer.on('mouseover', function() {
        this.setStyle({
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        });
        this.bringToFront();
    });

    layer.on('mouseout', function() {
        geojsonLayer.resetStyle(this);
    });
}

function loadPollingPlaces() {
    fetch('Data/geocoded_polling_places.csv')
        .then(response => response.text())
        .then(csvData => {
            const pollingPlaces = parseCSV(csvData);
            displayPollingPlaces(pollingPlaces);
        })
        .catch(error => {
            console.error('Error loading polling places:', error);
        });
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Handle CSV with quoted fields that may contain commas
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, ''));
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        // Only add rows with valid coordinates
        if (row.latitude && row.longitude && row.geocode_status === 'success') {
            data.push(row);
        }
    }
    
    return data;
}

function displayPollingPlaces(pollingPlaces) {
    // Create a layer group for all polling place markers
    pollingPlacesLayer = L.layerGroup();
    
    pollingPlaces.forEach(place => {
        const lat = parseFloat(place.latitude);
        const lon = parseFloat(place.longitude);
        
        if (isNaN(lat) || isNaN(lon)) return;
        
        // Create custom icon for polling places
        const pollingIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [17, 28],
            iconAnchor: [7, 25],
            popupAnchor: [1, -24],
            shadowSize: [25, 25]
        });
        
        // Create popup content with polling place details
        const popupContent = `
            <div class="polling-popup">
                <h3>${place.TOWN || 'Unknown'}</h3>
                <p><strong>Location:</strong> ${place['POLLING LOCATION'] || 'N/A'}</p>
                <p><strong>Address:</strong> ${place['STREET ADDRESS'] || 'N/A'}</p>
                <p><strong>Date:</strong> ${place.DATE || 'N/A'}</p>
                <p><strong>Polls Open:</strong> ${place['POLLS OPEN'] || 'N/A'}</p>
                ${place['OTHER ELECTION INFO'] ? `<p><strong>Info:</strong> ${place['OTHER ELECTION INFO']}</p>` : ''}
                ${place['CLERK TEL #'] ? `<p><strong>Clerk:</strong> ${place['CLERK TEL #']}</p>` : ''}
                <span style="font-size: 12px; color: #666;">Note: locations based on 2025 poll places.</span>
            </div>
        `;
        
        // Create marker and add to layer group
        const marker = L.marker([lat, lon], { icon: pollingIcon })
            .bindPopup(popupContent);
        
        pollingPlacesLayer.addLayer(marker);
    });
    
    // Add to map if visible
    if (layersVisible.pollingPlaces) {
        pollingPlacesLayer.addTo(map);
    }
    
    console.log(`Loaded ${pollingPlaces.length} polling places`);
}

function addYearControl() {
    // Set fixed year range from 2014 to 2024
    const minYear = 2014;
    const maxYear = 2024;
    
    // Create custom control
    const YearControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'year-control leaflet-bar leaflet-control');
            container.style.backgroundColor = 'white';
            container.style.padding = '15px';
            container.style.borderRadius = '4px';
            container.style.minWidth = '200px';
            
            const labelContainer = L.DomUtil.create('div', '', container);
            labelContainer.style.marginBottom = '8px';
            labelContainer.style.display = 'flex';
            labelContainer.style.justifyContent = 'space-between';
            labelContainer.style.alignItems = 'center';
            
            const label = L.DomUtil.create('span', '', labelContainer);
            label.innerHTML = '<strong>Year:</strong>';
            
            const yearDisplay = L.DomUtil.create('span', 'year-display', labelContainer);
            yearDisplay.innerHTML = selectedYear;
            yearDisplay.style.fontSize = '16px';
            yearDisplay.style.fontWeight = 'bold';
            yearDisplay.style.color = '#1a5f3f';
            
            const slider = L.DomUtil.create('input', 'year-slider', container);
            slider.type = 'range';
            slider.min = minYear;
            slider.max = maxYear;
            slider.value = selectedYear;
            slider.step = 1;
            slider.style.width = '100%';
            slider.style.cursor = 'pointer';
            
            const rangeLabels = L.DomUtil.create('div', '', container);
            rangeLabels.style.display = 'flex';
            rangeLabels.style.justifyContent = 'space-between';
            rangeLabels.style.fontSize = '11px';
            rangeLabels.style.color = '#666';
            rangeLabels.style.marginTop = '5px';
            rangeLabels.innerHTML = `<span>${minYear}</span><span>${maxYear}</span>`;
            
            // Prevent map interactions when using slider
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            
            slider.addEventListener('input', function(e) {
                yearDisplay.innerHTML = e.target.value;
            });
            
            slider.addEventListener('change', function(e) {
                selectedYear = e.target.value;
                renderGeoJSON();
                console.log('Changed to year:', selectedYear);
            });
            
            return container;
        }
    });
    
    new YearControl().addTo(map);
}

function addLayerControl() {
    const LayerControl = L.Control.extend({
        options: {
            position: 'topleft'
        },
        
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'layer-control leaflet-bar leaflet-control');
            container.style.backgroundColor = 'white';
            container.style.padding = '12px';
            container.style.borderRadius = '4px';
            
            const title = L.DomUtil.create('div', '', container);
            title.innerHTML = '<strong>Map Layers</strong>';
            title.style.marginBottom = '8px';
            title.style.fontSize = '14px';
            title.style.color = '#333';
            
            // Town turnout checkbox
            const turnoutLabel = L.DomUtil.create('label', '', container);
            turnoutLabel.style.display = 'flex';
            turnoutLabel.style.alignItems = 'center';
            turnoutLabel.style.marginBottom = '6px';
            turnoutLabel.style.cursor = 'pointer';
            turnoutLabel.style.fontSize = '13px';
            
            const turnoutCheckbox = L.DomUtil.create('input', '', turnoutLabel);
            turnoutCheckbox.type = 'checkbox';
            turnoutCheckbox.checked = layersVisible.turnout;
            turnoutCheckbox.style.marginRight = '8px';
            turnoutCheckbox.style.cursor = 'pointer';
            
            const turnoutText = L.DomUtil.create('span', '', turnoutLabel);
            turnoutText.innerHTML = 'Town Turnout Data';
            
            // Polling places checkbox
            const pollingLabel = L.DomUtil.create('label', '', container);
            pollingLabel.style.display = 'flex';
            pollingLabel.style.alignItems = 'center';
            pollingLabel.style.cursor = 'pointer';
            pollingLabel.style.fontSize = '13px';
            
            const pollingCheckbox = L.DomUtil.create('input', '', pollingLabel);
            pollingCheckbox.type = 'checkbox';
            pollingCheckbox.checked = layersVisible.pollingPlaces;
            pollingCheckbox.style.marginRight = '8px';
            pollingCheckbox.style.cursor = 'pointer';
            
            const pollingText = L.DomUtil.create('span', '', pollingLabel);
            pollingText.innerHTML = 'Polling Places';
            
            // Prevent map interactions
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            
            // Event listeners
            turnoutCheckbox.addEventListener('change', function(e) {
                layersVisible.turnout = e.target.checked;
                if (geojsonLayer) {
                    if (e.target.checked) {
                        geojsonLayer.addTo(map);
                    } else {
                        map.removeLayer(geojsonLayer);
                    }
                }
            });
            
            pollingCheckbox.addEventListener('change', function(e) {
                layersVisible.pollingPlaces = e.target.checked;
                if (pollingPlacesLayer) {
                    if (e.target.checked) {
                        pollingPlacesLayer.addTo(map);
                    } else {
                        map.removeLayer(pollingPlacesLayer);
                    }
                }
            });
            
            return container;
        }
    });
    
    new LayerControl().addTo(map);
}

function showErrorMessage(message) {
    const mapElement = document.getElementById('map');
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
        text-align: center;
        z-index: 1000;
    `;
    errorDiv.innerHTML = `<p>${message}</p>`;
    mapElement.appendChild(errorDiv);
}

function createAvgTurnoutChart() {
    // Calculate average turnout by year
    const yearStats = {};
    
    Object.values(turnoutData).forEach(entry => {
        if (!yearStats[entry.year]) {
            yearStats[entry.year] = {
                australianCount: 0,
                australianSum: 0,
                floorCount: 0,
                floorSum: 0
            };
        }
        
        if (entry.australianBallotTurnout !== null) {
            yearStats[entry.year].australianSum += entry.australianBallotTurnout;
            yearStats[entry.year].australianCount++;
        }
        if (entry.floorVoteTurnout !== null) {
            yearStats[entry.year].floorSum += entry.floorVoteTurnout;
            yearStats[entry.year].floorCount++;
        }
    });
    
    // Convert to array and calculate averages
    const chartData = Object.keys(yearStats).map(year => {
        const stats = yearStats[year];
        const dataPoint = {
            year: parseInt(year),
            australianAvg: stats.australianCount > 0 ? (stats.australianSum / stats.australianCount) * 100 : null,
            floorAvg: stats.floorCount > 0 ? (stats.floorSum / stats.floorCount) * 100 : null
        };
        return dataPoint;
    }).sort((a, b) => a.year - b.year);

    // drop first entry of chartData
    chartData.shift();
    
    console.log('Chart data:', chartData);
    
    if (chartData.length === 0) {
        console.warn('No chart data to display');
        return;
    }
    
    renderLineChart(chartData, {
        containerId: 'avg-turnout-chart',
        title: 'Average Statewide Turnout by Year'
    });
}

function createTownTurnoutChart(townName) {
    const townKey = townName.trim().toUpperCase();
    const yearMap = {};

    Object.values(turnoutData).forEach(entry => {
        if (entry.town !== townKey) return;
        yearMap[entry.year] = {
            year: parseInt(entry.year),
            australianAvg: entry.australianBallotTurnout !== null ? entry.australianBallotTurnout * 100 : null,
            floorAvg: entry.floorVoteTurnout !== null ? entry.floorVoteTurnout * 100 : null
        };
    });

    const chartData = Object.values(yearMap).sort((a, b) => a.year - b.year);

    const sidebar = document.getElementById('map-sidebar');
    if (!sidebar) {
        console.warn('map-sidebar not found');
        return;
    }

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <h3>${townName}</h3>
            <p>Turnout by year</p>
        </div>
        <div id="map-sidebar-chart"></div>
    `;

    if (chartData.length === 0) {
        const chartContainer = document.getElementById('map-sidebar-chart');
        if (chartContainer) {
            chartContainer.innerHTML = '<p class="sidebar-empty">No turnout data available for this town.</p>';
        }
        return;
    }

    renderLineChart(chartData, {
        containerId: 'map-sidebar-chart',
        title: `${townName} Turnout by Year`,
        compact: true
    });
}

function renderLineChart(data, options = {}) {
    const containerId = options.containerId || 'avg-turnout-chart';
    const chartTitle = options.title || 'Average Statewide Turnout by Year';
    const compact = options.compact === true;
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();
    
    // Set up dimensions
    const margin = compact
        ? { top: 30, right: 20, bottom: 120, left: 50 }
        : { top: 40, right: 150, bottom: 60, left: 60 };
    const containerWidth = document.getElementById(containerId).offsetWidth || 800;
    const width = containerWidth - margin.left - margin.right;
    const height = (compact ? 320 : 400) - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d.australianAvg || 0, d.floorAvg || 0)) * 1.1])
        .range([height, 0]);
    
    // Line generators
    const australianLine = d3.line()
        .defined(d => d.australianAvg !== null)
        .x(d => xScale(d.year))
        .y(d => yScale(d.australianAvg))
        .curve(d3.curveMonotoneX);
    
    const floorLine = d3.line()
        .defined(d => d.floorAvg !== null)
        .x(d => xScale(d.year))
        .y(d => yScale(d.floorAvg))
        .curve(d3.curveMonotoneX);
    
    // format x axis values to be only the last two values of the year (e.g. 2014 -> '14)
    const xAxis = d3.axisBottom(xScale)
        .tickValues(data.map(d => d.year))
        .tickFormat(d => `'${d.toString().slice(-2)}`);
    
    // yAxis with max of 5 ticks
    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => d + '%');
    
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-size', '12px');
    
    svg.append('g')
        .call(yAxis)
        .selectAll('text')
        .style('font-size', '12px');
    
    // Grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat(''));
    
    // Lines
    const colors = {
        australian: '#1a5f3f',
        floor: '#2196F3'
    };
    
    svg.append('path')
        .datum(data)
        .attr('class', 'line australian-line')
        .attr('fill', 'none')
        .attr('stroke', colors.australian)
        .attr('stroke-width', 3)
        .attr('d', australianLine);
    
    svg.append('path')
        .datum(data)
        .attr('class', 'line floor-line')
        .attr('fill', 'none')
        .attr('stroke', colors.floor)
        .attr('stroke-width', 3)
        .attr('d', floorLine);
    
    // Tooltip
    const tooltip = container.append('div')
        .attr('class', 'chart-tooltip')
        .style('opacity', 0);
    
    // Add invisible overlay for hover
    const bisect = d3.bisector(d => d.year).left;
    
    const focus = svg.append('g')
        .style('display', 'none');
    
    focus.append('line')
        .attr('class', 'x-hover-line')
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', '#999')
        .style('stroke-width', '1px')
        .style('stroke-dasharray', '3,3');
    
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', () => focus.style('display', null))
        .on('mouseout', () => {
            focus.style('display', 'none');
            tooltip.style('opacity', 0);
        })
        .on('mousemove', function(event) {
            const x0 = xScale.invert(d3.pointer(event, this)[0]);
            const i = bisect(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0 - d0?.year > d1?.year - x0 ? d1 : d0;
            
            if (d) {
                focus.attr('transform', `translate(${xScale(d.year)},0)`);
            
                
                let tooltipHTML = `<strong>Year: ${d.year}</strong><br/>`;
                if (d.australianAvg !== null) {
                    tooltipHTML += `<span style="color: ${colors.australian}">● Australian Ballot: ${d.australianAvg.toFixed(1)}%</span><br/>`;
                }
                if (d.floorAvg !== null) {
                    tooltipHTML += `<span style="color: ${colors.floor}">● Floor Vote: ${d.floorAvg.toFixed(1)}%</span>`;
                }
                
                const containerRect = document.getElementById(containerId).getBoundingClientRect();
                const localX = event.clientX - containerRect.left;
                const localY = event.clientY - containerRect.top;

                tooltip.html(tooltipHTML)
                    .style('left', (localX - 52) + 'px')
                    .style('top', (localY + 18) + 'px')
                    .style('opacity', 1);
            }
        });
    
    
    
    
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', compact ? `translate(${width - 140}, 0)` : `translate(${width + 20}, 0)`);
    
    if (compact) {
        //translate legend to below the chart and increase bottom margin
        legend.attr('transform', `translate(0, ${height + 50})`);

        margin.bottom += 90;
    }
    
    const legendItems = [
        { label: 'Australian Ballot', color: colors.australian },
        { label: 'Floor Vote', color: colors.floor }
    ];
    
    legendItems.forEach((item, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        legendRow.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 10)
            .attr('y2', 10)
            .attr('stroke', item.color)
            .attr('stroke-width', 3);
        
        legendRow.append('text')
            .attr('x', 25)
            .attr('y', 10)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .text(item.label);
    });
    
    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(chartTitle);
    
    // Axis labels
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Turnout (%)');
    
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Year');
    
    // Handle window resize
    chartRenderCache[containerId] = { data, options };

    if (!renderLineChart._resizeBound) {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                Object.values(chartRenderCache).forEach(entry => {
                    renderLineChart(entry.data, entry.options);
                });
            }, 250);
        });
        renderLineChart._resizeBound = true;
    }
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', initMap);

// Add legend
let legendControl = null;

function addLegend() {
    if (legendControl) {
        map.removeControl(legendControl);
    }
    
    legendControl = L.control({ position: 'bottomright' });

    legendControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.cssText = `
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
        `;

        const grades = [
            { min: 40, label: '40%+ Turnout', color: '#1a5f3f' },
            { min: 30, label: '30-39% Turnout', color: '#2a7f5f' },
            { min: 20, label: '20-29% Turnout', color: '#4ca87a' },
            { min: 10, label: '10-19% Turnout', color: '#f0ad4e' },
            { min: 0, label: '0-9% Turnout', color: '#c9302c' },
            { min: -1, label: 'No Data', color: '#cccccc' }
        ];
        
        const metricLabels = {
            australianBallotTurnout: 'Australian Ballot Turnout',
            floorVoteTurnout: 'Floor Vote Turnout'
        };

        let html = `<strong>${metricLabels[selectedMetric]}</strong><br>`;
        grades.forEach(grade => {
            html += `<i style="background:${grade.color}; width: 18px; height: 18px; display: inline-block; margin-right: 8px; opacity: 0.7; border: 1px solid white;"></i><span style="line-height: 18px;">${grade.label}</span><br>`;
        });

        div.innerHTML = html;
        return div;
    };

    legendControl.addTo(map);
}

function addMetricSelector() {
    const MetricSelector = L.Control.extend({
        options: {
            position: 'topright'
        },
        
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'metric-selector leaflet-bar leaflet-control');
            container.style.backgroundColor = 'white';
            container.style.padding = '12px';
            container.style.borderRadius = '4px';
            container.style.marginTop = '10px';
            container.style.minWidth = '200px';
            
            const label = L.DomUtil.create('label', '', container);
            label.innerHTML = '<strong>Map Metric:</strong>';
            label.style.display = 'block';
            label.style.marginBottom = '6px';
            label.style.fontSize = '14px';
            
            const select = L.DomUtil.create('select', '', container);
            select.style.width = '100%';
            select.style.padding = '6px';
            select.style.fontSize = '13px';
            select.style.border = '1px solid #ccc';
            select.style.borderRadius = '3px';
            select.style.cursor = 'pointer';
            
            const options = [
                { value: 'australianBallotTurnout', label: 'Australian Ballot' },
                { value: 'floorVoteTurnout', label: 'Floor Vote' }
            ];
            
            options.forEach(opt => {
                const option = L.DomUtil.create('option', '', select);
                option.value = opt.value;
                option.text = opt.label;
                if (opt.value === selectedMetric) {
                    option.selected = true;
                }
            });
            
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            
            select.addEventListener('change', function(e) {
                selectedMetric = e.target.value;
                renderGeoJSON();
                addLegend();
                console.log('Changed metric to:', selectedMetric);
            });
            
            return container;
        }
    });
    
    new MetricSelector().addTo(map);
}
