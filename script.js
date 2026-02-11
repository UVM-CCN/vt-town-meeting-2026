let map;
let geojsonLayer;

function initMap() {
    // Initialize map centered on Vermont
    map = L.map('map').setView([44.0, -72.71], 7);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 6
    }).addTo(map);

    // Load Vermont towns GeoJSON
    loadVermontGeoJSON();
}

function loadVermontGeoJSON() {
    fetch('vermont-towns.geojson')
        .then(response => response.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: getStyleForFeature,
                onEachFeature: onEachFeature
            }).addTo(map);
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
            // Fallback: show a message to user
            showErrorMessage('Unable to load town data. Please refresh the page.');
        });
}

function getStyleForFeature(feature) {
    // Color based on participation or results
    const participationRate = feature.properties.participation || 0;
    let color;

    if (participationRate >= 75) {
        color = '#1a5f3f'; // Dark green - high participation
    } else if (participationRate >= 50) {
        color = '#2a7f5f'; // Medium green
    } else if (participationRate >= 25) {
        color = '#f0ad4e'; // Amber - moderate
    } else {
        color = '#c9302c'; // Red - low participation
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
    const popupContent = `
        <div class="town-popup">
            <h3>${props.name || 'Unknown Town'}</h3>
            <p><strong>Participation:</strong> ${props.participation || 'N/A'}%</p>
            <p><strong>Population:</strong> ${props.population || 'N/A'}</p>
            <p><strong>Attendance:</strong> ${props.attendance || 'N/A'}</p>
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

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', initMap);

// Optional: Add legend
function addLegend() {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.cssText = `
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
        `;

        const grades = [
            { min: 75, label: '75%+ Participation', color: '#1a5f3f' },
            { min: 50, label: '50-74% Participation', color: '#2a7f5f' },
            { min: 25, label: '25-49% Participation', color: '#f0ad4e' },
            { min: 0, label: '0-24% Participation', color: '#c9302c' }
        ];

        let html = '<strong>Participation Rates</strong><br>';
        grades.forEach(grade => {
            html += `<i style="background:${grade.color}; width: 18px; height: 18px; float: left; margin-right: 8px; opacity: 0.7; border: 1px solid white;"></i><span>${grade.label}</span><br>`;
        });

        div.innerHTML = html;
        return div;
    };

    legend.addTo(map);
}
