import { fetchItems, displayList, handleListClick, handleIdsSharedM2 } from "./top-right.js";
const map = L.map('china-map').setView([32, 104], 4);

// Enhanced tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

let markers = [];
let selectedMarker = null;

// Enhanced custom icons with better visual design
const defaultIcon = L.divIcon({
  className: 'custom-marker default',
  html: `<div style="
    background-color: #3498db; 
    width: 12px; 
    height: 12px; 
    border-radius: 50%; 
    border: 2px solid white; 
    box-shadow: 0 0 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const greyIcon = L.divIcon({
  className: 'custom-marker grey',
  html: `<div style="
    background-color: #95a5a6; 
    width: 12px; 
    height: 12px; 
    border-radius: 50%; 
    border: 2px solid white; 
    box-shadow: 0 0 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const highlightedIcon = L.divIcon({
  className: 'custom-marker highlighted',
  html: `<div style="
    background-color: #e74c3c; 
    width: 16px; 
    height: 16px; 
    border-radius: 50%; 
    border: 3px solid white; 
    box-shadow: 0 0 10px rgba(231,76,60,0.6);
    animation: pulse 2s infinite;
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// Different icons for different data types
const paperIcon = L.divIcon({
  className: 'custom-marker paper',
  html: `<div style="
    background-color: #3498db; 
    width: 12px; 
    height: 12px; 
    border-radius: 50%; 
    border: 2px solid white; 
    box-shadow: 0 0 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const authorIcon = L.divIcon({
  className: 'custom-marker author',
  html: `<div style="
    background-color: #27ae60; 
    width: 12px; 
    height: 12px; 
    border-radius: 50%; 
    border: 2px solid white; 
    box-shadow: 0 0 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const itemIcon = L.divIcon({
  className: 'custom-marker item',
  html: `<div style="
    background-color: #f39c12; 
    width: 12px; 
    height: 12px; 
    border-radius: 50%; 
    border: 2px solid white; 
    box-shadow: 0 0 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  .custom-marker {
    background: transparent;
    border: none;
  }
  .map-filter-control {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    background: white;
    padding: 10px 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    border: 1px solid #e0e0e0;
    font-family: Arial, sans-serif;
  }
  .map-filter-control select {
    padding: 8px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    font-size: 13px;
    color: #333;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 150px;
    margin-bottom: 5px;
  }
  .map-filter-control select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  .map-filter-control select:hover {
    border-color: #bdc3c7;
    background-color: #f8f9fa;
  }
  .map-filter-control label {
    display: block;
    margin-bottom: 5px;
    font-size: 12px;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .map-stats {
    position: absolute;
    bottom: 30px;
    left: 10px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border: 1px solid #e0e0e0;
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: #666;
    backdrop-filter: blur(5px);
  }
  .legend {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    border: 1px solid #e0e0e0;
    font-family: Arial, sans-serif;
    font-size: 12px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }
  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
    border: 2px solid white;
    box-shadow: 0 0 3px rgba(0,0,0,0.3);
  }
`;
document.head.appendChild(style);

let allPaperData = [];

// Create filter control and add it to the map
function createMapFilterControl() {
  const filterControl = document.createElement('div');
  filterControl.className = 'map-filter-control';
  filterControl.innerHTML = `
    <label for="map-region-select">Filter by Region</label>
    <select id="map-region-select">
      <option value="">All Regions</option>
    </select>
    <label for="map-type-select">Filter by Type</label>
    <select id="map-type-select">
      <option value="">All Types</option>
      <option value="paper">Papers</option>
      <option value="author">Authors</option>
      <option value="item">Items</option>
    </select>
  `;

  // Add the control to the map container
  const mapContainer = document.getElementById('china-map');
  mapContainer.appendChild(filterControl);

  return filterControl;
}

// Create legend
function createMapLegend() {
  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">Data Types</div>
    <div class="legend-item">
      <div class="legend-dot" style="background-color: #3498db;"></div>
      <span>Papers (${allPaperData.filter(d => d.type === 'paper').length})</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background-color: #27ae60;"></div>
      <span>Authors (${allPaperData.filter(d => d.type === 'author').length})</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background-color: #f39c12;"></div>
      <span>Items (${allPaperData.filter(d => d.type === 'item').length})</span>
    </div>
  `;
  
  const mapContainer = document.getElementById('china-map');
  mapContainer.appendChild(legend);
  
  return legend;
}

// Create stats display
function createMapStats() {
  const statsControl = document.createElement('div');
  statsControl.className = 'map-stats';
  statsControl.id = 'map-stats';
  statsControl.innerHTML = 'Loading all data...';
  
  // Add the stats to the map container
  const mapContainer = document.getElementById('china-map');
  mapContainer.appendChild(statsControl);

  return statsControl;
}

// Update stats display
function updateMapStats(total, filtered, filter = null) {
  const statsElement = document.getElementById('map-stats');
  if (filter) {
    statsElement.innerHTML = `Showing ${filtered} of ${total} items • Filter: ${filter}`;
  } else {
    statsElement.innerHTML = `Showing ${total} items • All data sources`;
  }
}

// Helper functions to map Chinese place names to coordinates
function getLatitudeFromPlace(place) {
  const placeCoords = {
    '陕西西安佛寺': 34.27,
    '河北正定龙兴寺': 38.15, 
    '长安修德坊弘福寺': 34.27,
    '河南登封嵩山中岳庙': 34.45,
    '江苏镇江焦山西麓崖壁': 32.21,
    '长安鸣犊镇皇甫川': 34.30,
    '陕西麟游': 34.68,
    '河南洛阳龙门石窟': 34.55,
    '江苏句容玉晨观': 31.95,
    '山东曲阜孔庙': 35.60,
    '河南济宁嘉祥县': 35.41,
    '湖南长沙岳麓书院': 28.30,
    '长安怀德坊慧日寺': 34.27,
    '陕西西安碑林': 34.26,
    '河南孟县': 34.90,
    '江苏扬州市': 32.40,
    '山东临沂市': 35.05,
    '浙江湖州市': 30.90,
    '浙江嘉兴市': 30.75,
    '浙江宁波市': 30.03,
    '河南禹州市': 34.75,
    '湖北武汉市': 30.35,
    '山西太原市': 37.87,
    '山西运城市': 35.02,
    '山西晋中市': 37.68,
    '陕西运城市': 35.02,
    '江苏扬州': 32.40,
    '山东临沂': 35.05,
    '浙江湖州': 30.90,
    '浙江嘉兴': 30.75,
    'unknown': 35
  };
  return placeCoords[place] || 35;
}

function getLongitudeFromPlace(place) {
  const placeCoords = {
    '陕西西安佛寺': 108.93,
    '河北正定龙兴寺': 114.77,
    '长安修德坊弘福寺': 108.93, 
    '河南登封嵩山中岳庙': 113.03,
    '江苏镇江焦山西麓崖壁': 119.47,
    '长安鸣犊镇皇甫川': 108.95,
    '陕西麟游': 107.79,
    '河南洛阳龙门石窟': 112.47,
    '江苏句容玉晨观': 119.16,
    '山东曲阜孔庙': 116.99,
    '河南济宁嘉祥县': 116.34,
    '湖南长沙岳麓书院': 112.93,
    '长安怀德坊慧日寺': 108.93,
    '陕西西安碑林': 108.94,
    '河南孟县': 112.89,
    '江苏扬州市': 119.40,
    '山东临沂市': 118.35,
    '浙江湖州市': 120.08,
    '浙江嘉兴市': 120.75,
    '浙江宁波市': 121.15,
    '河南禹州市': 113.62,
    '湖北武汉市': 114.32,
    '山西太原市': 112.55,
    '山西运城市': 111.02,
    '山西晋中市': 112.75,
    '陕西运城市': 111.02,
    '江苏扬州': 119.40,
    '山东临沂': 118.35,
    '浙江湖州': 120.08,
    '浙江嘉兴': 120.75,
    'unknown': 110
  };
  return placeCoords[place] || 110;
}

function getRegionFromPlace(place) {
  if (place.includes('陕西') || place.includes('长安')) return '陕西省';
  if (place.includes('河北')) return '河北省';
  if (place.includes('河南')) return '河南省';
  if (place.includes('江苏')) return '江苏省';
  if (place.includes('山东')) return '山东省';
  if (place.includes('湖南')) return '湖南省';
  if (place.includes('浙江')) return '浙江省';
  if (place.includes('湖北')) return '湖北省';
  if (place.includes('山西')) return '山西省';
  if (place.includes('北京')) return '北京市';
  return 'Unknown';
}

// Load ALL data sources - papers, authors, and items
Promise.all([
  fetch('/papers').then(r => r.json()),
  fetch('/authors').then(r => r.json()), 
  fetch('/items').then(r => r.json())
])
.then(([papers, authors, items]) => {
  console.log(`Raw data loaded: ${papers.length} papers, ${authors.length} authors, ${items.length} items`);
  
  // Combine all data sources
  allPaperData = [
    // Papers (already have coordinates)
    ...papers.map(p => ({
      id: `paper_${p.id}`,
      type: 'paper',
      title: p.title,
      latitude: p.latitude,
      longitude: p.longitude,
      region: p.region,
      details: p
    })),
    
    // Authors (extract coordinates from location string)
    ...authors.filter(a => a.place && a.place.location && a.place.location !== 'unknown')
      .map(a => {
        const coords = a.place.location.split(',');
        if (coords.length === 2 && !isNaN(parseFloat(coords[0])) && !isNaN(parseFloat(coords[1]))) {
          return {
            id: `author_${a.id}`,
            type: 'author', 
            title: a.name,
            latitude: parseFloat(coords[0]),
            longitude: parseFloat(coords[1]),
            region: a.place.province,
            details: a
          };
        }
        return null;
      })
      .filter(a => a !== null),
      
    // Items (map creation places to coordinates)
    ...items.filter(i => i.stele && i.stele.creationPlace && i.stele.creationPlace !== 'unknown')
      .map(i => {
        const lat = getLatitudeFromPlace(i.stele.creationPlace);
        const lng = getLongitudeFromPlace(i.stele.creationPlace);
        if (lat !== 35 || lng !== 110) { // Only include if we have real coordinates
          return {
            id: `item_${i.id}`,
            type: 'item',
            title: i.name,
            latitude: lat,
            longitude: lng,
            region: getRegionFromPlace(i.stele.creationPlace),
            details: i
          };
        }
        return null;
      })
      .filter(i => i !== null)
  ];
  
  console.log(`Combined data: ${allPaperData.length} total items for map display`);
  console.log(`- Papers: ${allPaperData.filter(d => d.type === 'paper').length}`);
  console.log(`- Authors: ${allPaperData.filter(d => d.type === 'author').length}`);
  console.log(`- Items: ${allPaperData.filter(d => d.type === 'item').length}`);
  
  populateMapRegionDropdown(allPaperData);
  renderMarkers(allPaperData);
  updateMapStats(allPaperData.length, allPaperData.length);
  
  // Update legend with actual counts
  const legend = document.querySelector('.legend');
  if (legend) {
    legend.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Data Types</div>
      <div class="legend-item">
        <div class="legend-dot" style="background-color: #3498db;"></div>
        <span>Papers (${allPaperData.filter(d => d.type === 'paper').length})</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background-color: #27ae60;"></div>
        <span>Authors (${allPaperData.filter(d => d.type === 'author').length})</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background-color: #f39c12;"></div>
        <span>Items (${allPaperData.filter(d => d.type === 'item').length})</span>
      </div>
    `;
  }
})
.catch(error => {
  console.error('Error fetching data:', error);
  document.getElementById('map-stats').innerHTML = 'Error loading data';
  document.querySelector('.top-right').innerHTML = `
    <div style="color: #e74c3c; text-align: center; padding: 20px;">
      <h3>Error Loading Data</h3>
      <p>Failed to load data. Make sure Flask endpoints /papers, /authors, /items are available.</p>
    </div>
  `;
});

function renderMarkers(data) {
  // Clear existing markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(item => {
    let icon;
    // Choose icon based on data type
    switch(item.type) {
      case 'paper': icon = paperIcon; break;
      case 'author': icon = authorIcon; break;
      case 'item': icon = itemIcon; break;
      default: icon = defaultIcon;
    }
    
    const marker = L.marker([item.latitude, item.longitude], { icon }).addTo(map);

    // Store item data in marker
    marker.itemData = item;

    // CORRECTED: hover shows popup instead of updating panels
    marker.on('mouseover', function() {
      let popupContent = '';
      
      if (item.type === 'paper') {
        popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #3498db; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
              📄 ${item.title}
            </h4>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Type:</strong> Paper</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Museum:</strong> ${item.details.museum}</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Found in:</strong> ${item.details.location_found}</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Region:</strong> ${item.details.region}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #666; font-style: italic;">
              ${item.details.text ? item.details.text.substring(0, 80) + '...' : ''}
            </p>
          </div>
        `;
      } else if (item.type === 'author') {
        popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #27ae60; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
              👤 ${item.title}
            </h4>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Type:</strong> Author</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Dynasty:</strong> ${item.details.temporal}</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Location:</strong> ${item.details.place.city}, ${item.details.place.province}</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Works:</strong> ${item.details.works?.length || 0} pieces</p>
            ${item.details.birth?.birthYear && item.details.birth?.birthYear !== 'unknown' ? 
              `<p style="margin: 2px 0; font-size: 12px;"><strong>Years:</strong> ${item.details.birth.birthYear} - ${item.details.birth.deathYear}</p>` : ''}
          </div>
        `;
      } else if (item.type === 'item') {
        popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #f39c12; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
              🏛️ ${item.title}
            </h4>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Type:</strong> Historical Item</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Style:</strong> ${item.details.calligraphyStyle}</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Period:</strong> ${item.details.temporal}</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Location:</strong> ${item.details.stele?.creationPlace}</p>
            ${item.details.authors && item.details.authors.length > 0 ? 
              `<p style="margin: 2px 0; font-size: 12px;"><strong>Author:</strong> ${item.details.authors[0].author}</p>` : ''}
          </div>
        `;
      }

      this.bindPopup(popupContent, {
        offset: [0, -10],
        closeButton: false,
        autoClose: false,
        closeOnClick: false
      }).openPopup();
    });

    // Reset on mouse out
    marker.on('mouseout', function() {
      this.closePopup();
    });

    // CORRECTED: click sends id to other modules instead of zooming
    marker.on('click', function() {
      // Send item id to other modules (moduleIndex 1 = 'middle')
      dispatch_shared_ids([item.id], 1);
      console.log('Map clicked, sending id:', item.id, 'type:', item.type, 'title:', item.title);
    });

    markers.push(marker);
  });
}

// Enhanced map click to reset to default state
map.on('click', (e) => {
  // Only reset if clicking on empty space
  if (e.originalEvent.target === e.originalEvent.currentTarget ||
    !e.originalEvent.target.closest('.leaflet-marker-icon')) {

    // Reset all markers to default
    markers.forEach(m => {
      switch(m.itemData.type) {
        case 'paper': m.setIcon(paperIcon); break;
        case 'author': m.setIcon(authorIcon); break;
        case 'item': m.setIcon(itemIcon); break;
      }
    });
    
    // Reset info panels to default hover instructions
    document.querySelector('.top-right').innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        <h3>All Data Information</h3>
        <p>Hover over any marker to view details</p>
        <p style="font-size: 12px; margin-top: 10px;">
          🔵 Papers • 🟢 Authors • 🟠 Items
        </p>
      </div>
    `;
    
    document.querySelector('.bottom-right').innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        <h3>Full Details</h3>
        <p>Click markers to send data to other modules</p>
      </div>
    `;
  }
});

// Generate dropdown options from all data and add to map
function populateMapRegionDropdown(data) {
  const regionSelect = document.getElementById('map-region-select');
  const typeSelect = document.getElementById('map-type-select');
  
  if (!regionSelect || !typeSelect) return;
  
  const regions = [...new Set(data.map(p => p.region).filter(r => r && r !== 'Unknown'))].sort();

  regionSelect.innerHTML = `<option value="">All Regions</option>`;
  regions.forEach(region => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });

  // Event listeners for filtering
  function applyFilters() {
    const selectedRegion = regionSelect.value;
    const selectedType = typeSelect.value;
    
    let filtered = allPaperData;
    
    if (selectedRegion) {
      filtered = filtered.filter(p => p.region === selectedRegion);
    }
    
    if (selectedType) {
      filtered = filtered.filter(p => p.type === selectedType);
    }
    
    const mapElement = document.getElementById('china-map');
    mapElement.style.opacity = '0.8';

    setTimeout(() => {
      renderMarkers(filtered);
      mapElement.style.opacity = '1';
      
      const filterText = [selectedRegion, selectedType].filter(f => f).join(' + ') || 'None';
      updateMapStats(allPaperData.length, filtered.length, filterText);
    }, 200);
  }

  regionSelect.addEventListener('change', applyFilters);
  typeSelect.addEventListener('change', applyFilters);
}

// Add keyboard shortcuts for better UX
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    // Reset all markers and info panels with Escape key
    markers.forEach(m => {
      switch(m.itemData.type) {
        case 'paper': m.setIcon(paperIcon); break;
        case 'author': m.setIcon(authorIcon); break;
        case 'item': m.setIcon(itemIcon); break;
      }
    });
    
    document.querySelector('.top-right').innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        <h3>All Data Information</h3>
        <p>Hover over any marker to view details</p>
      </div>
    `;
    
    document.querySelector('.bottom-right').innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        <h3>Full Details</h3>
        <p>Click markers to send data to other modules</p>
      </div>
    `;
  }
});

// Initialize the map controls when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Create the filter control, legend and stats display
  createMapFilterControl();
  createMapLegend();
  createMapStats();

  // Initialize with welcome message
  document.querySelector('.top-right').innerHTML = `
    <div style="text-align: center; color: #666; padding: 20px;">
      <h3>Ancient Stones Project</h3>
      <p>Loading all data sources...</p>
    </div>
  `;
  
  document.querySelector('.bottom-right').innerHTML = `
    <div style="text-align: center; color: #666; padding: 20px;">
      <h3>Getting Started</h3>
      <p>Hover over markers to explore all data</p>
    </div>
  `;
});

console.log('Ancient Stones Project - All Data Loaded');
console.log('Displaying Papers, Authors, and Items on map');


//-------------------------------------------------------
//-------------------------------------------------------
//-----------------transfer information between modules-----------

export const modules = ['left', 'middle', 'top-right', 'bottom-right']

// if a module need to trigger event, call this function to transfer idsArray
export function dispatch_shared_ids(idsArray, moduleIndex) {
  if (!Array.isArray(idsArray)) {
    console.error("dispatch_shared_ids: idsArray must be an array");
    return
  }
  if (!Number.isInteger(moduleIndex) || moduleIndex > 4 || moduleIndex < 0) {
    console.error("dispatch_shared_ids: moduleIndex error")
    return;
  }

  //create event
  const event = new CustomEvent('idsShared', {
    detail: {
      ids: idsArray,
      module: modules[moduleIndex]
    },
    bubbles: true
  });

  //dispatch event
  document.dispatchEvent(event);
}



//-------------------------------------------------------
//----------------add event listener for each module--------

//module 'left'
document.addEventListener('idsShared', (event) => {
  if (event.detail.module === 'left') {
    //self trigger event, ignore it 
    return;
  }
  const ids_received = event.detail.ids;

  // handle ids_reveived for 'left' module
  // TODO


})

//module 'middle' - COMPLETED TODO
document.addEventListener('idsShared', (event) => {
  if (event.detail.module === 'middle') {
    //self trigger event, ignore it 
    return;
  }
  const ids_received = event.detail.ids;

  // handle ids_received for 'middle' module - HIGHLIGHT RELATIVE POINTS
  console.log('Map received ids from', event.detail.module, ':', ids_received);
  
  // Reset all markers to default state
  markers.forEach(marker => {
    switch(marker.itemData.type) {
      case 'paper': marker.setIcon(paperIcon); break;
      case 'author': marker.setIcon(authorIcon); break;
      case 'item': marker.setIcon(itemIcon); break;
      default: marker.setIcon(defaultIcon);
    }
  });
  
  // Highlight matching markers
  markers.forEach(marker => {
    if (ids_received.includes(marker.itemData.id)) {
      marker.setIcon(highlightedIcon);
      console.log('Highlighted marker:', marker.itemData.title, 'type:', marker.itemData.type);
    }
  });
})

//module 'top-right'
document.addEventListener('idsShared', handleIdsSharedM2);

//module 'bottom-right'
document.addEventListener('idsShared', (event) => {
  if (event.detail.module === 'bottom-right') {
    //self trigger event, ignore it 
    return;
  }
  const ids_received = event.detail.ids;

  // handle ids_reveived for 'bottom-right' module
  // TODO

})

//-------------------------------------------------------
//--------------modules interaction----------
// module 'left'
const module_left = document.querySelector('.left');
// TODO for 'left' interaction


//module 'middle'
const module_middle = document.querySelector('.middle');
// TODO for 'middle' interaction


//  module 'top-right'
// implemented in the module's initialization


// module 'bottom-right'
const module_bottom_right = document.querySelector('.bottom-right');
// TODO for 'bottom-right' interaction