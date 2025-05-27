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
  `;

  // Add the control to the map container
  const mapContainer = document.getElementById('china-map');
  mapContainer.appendChild(filterControl);

  return filterControl;
}

// Create stats display
function createMapStats() {
  const statsControl = document.createElement('div');
  statsControl.className = 'map-stats';
  statsControl.id = 'map-stats';
  statsControl.innerHTML = 'Loading papers...';
  // Add the stats to the map container
  const mapContainer = document.getElementById('china-map');
  mapContainer.appendChild(statsControl);

  return statsControl;
}

// Update stats display
function updateMapStats(total, filtered, region = null) {
  const statsElement = document.getElementById('map-stats');
  if (region) {
    statsElement.innerHTML = `Showing ${filtered} of ${total} papers • Region: ${region}`;
  } else {
    statsElement.innerHTML = `Showing ${total} papers • All regions`;
  }
}

// Fetch data from your backend
fetch('/papers')
  .then(response => response.json())
  .then(data => {
    allPaperData = data;
    populateMapRegionDropdown(data);
    renderMarkers(data);
    updateMapStats(data.length, data.length);
  })
  .catch(error => {
    console.error('Error fetching papers:', error);
    document.getElementById('map-stats').innerHTML = 'Error loading data';
    // Show error message in UI
    // document.querySelector('.top-right').innerHTML = `
    //   <div style="color: #e74c3c; text-align: center; padding: 20px;">
    //     <h3>Error Loading Data</h3>
    //     <p>Failed to load paper data. Please refresh the page.</p>
    //   </div>
    // `;
  });

function renderMarkers(data) {
  // Clear existing markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(paper => {
    const marker = L.marker([paper.latitude, paper.longitude], {
      icon: defaultIcon
    }).addTo(map);

    // Enhanced popup with better formatting
    const popupContent = `
      <div style="font-family: Arial, sans-serif; max-width: 250px;">
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
          ${paper.title}
        </h4>
        <div style="margin-bottom: 8px;">
          <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
            <strong>Museum:</strong> ${paper.museum}
          </p>
          <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
            <strong>Found in:</strong> ${paper.location_found}
          </p>
          <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
            <strong>Region:</strong> ${paper.region}
          </p>
        </div>
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #888; line-height: 1.4;">
          ${paper.text ? paper.text.substring(0, 100) + '...' : 'Click marker for full details'}
        </p>
        <div style="border-top: 1px solid #eee; padding-top: 6px;">
          <p style="margin: 0; font-size: 10px; color: #999;">
            Click marker for detailed view
          </p>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);

    // Enhanced hover handler to show information
    marker.on('mouseover', function () {
      // Update marker visual
      this.setIcon(L.divIcon({
        className: 'custom-marker hover',
        html: `<div style="
          background-color: #2980b9; 
          width: 16px; 
          height: 16px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 0 10px rgba(41,128,185,0.8);
          transform: scale(1.1);
          transition: all 0.2s ease;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      }));

      // // Update info panels with paper information
      document.querySelector('.bottom-right').innerHTML = `
        <h3 style="color: #333; border-bottom: 2px solid #2980b9; padding-bottom: 8px; margin-bottom: 15px;">
          Full Transcription
        </h3>
        <div style="line-height: 1.6; color: #555; font-size: 14px; max-height: 300px; overflow-y: auto;">
          ${paper.text || 'No transcription available for this item.'}
        </div>
      `;
    });

    // Reset on mouse out
    marker.on('mouseout', function () {
      // Reset marker visual
      this.setIcon(defaultIcon);

      document.querySelector('.bottom-right').innerHTML = `
        <div style="text-align: center; color: #666; padding: 20px;">
          <h3>Full Transcription</h3>
          <p>Paper transcription will appear when hovering over markers</p>
        </div>
      `;
    });

    // Optional: Keep click handler for centering/zooming to location
    marker.on('click', () => {
      // Smooth zoom to selected marker
      map.setView([paper.latitude, paper.longitude], Math.max(map.getZoom(), 7), {
        animate: true,
        duration: 0.8
      });
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
    markers.forEach(m => m.setIcon(defaultIcon));

    // Reset info panels to default hover instructions
    document.querySelector('.bottom-right').innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        <h3>Full Transcription</h3>
        <p>Paper transcription will appear when hovering over markers</p>
      </div>
    `;
  }
});

// Generate dropdown options from your data and add to map
// Generate dropdown options from your data and add to map
function populateMapRegionDropdown(data) {
  const select = document.getElementById('map-region-select');
  const regions = [...new Set(data.map(p => p.region))].sort();

  // Clear previous options (except "All")
  select.innerHTML = `<option value="">All Regions</option>`;

  regions.forEach(region => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    select.appendChild(option);
    select.appendChild(option);
  });

  // Enhanced event listener with smooth filtering
  select.addEventListener('change', () => {
    const region = select.value;
    const filtered = region
      ? allPaperData.filter(p => p.region === region)
      : allPaperData;
    // Add smooth transition effect
    const mapElement = document.getElementById('china-map');
    mapElement.style.opacity = '0.8';

    setTimeout(() => {
      renderMarkers(filtered);
      mapElement.style.opacity = '1';

      // Update stats
      updateMapStats(allPaperData.length, filtered.length, region);

      // Update info panel with filter status but maintain hover instructions
    }, 200);
  });
}

// Add keyboard shortcuts for better UX
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    // Reset all markers and info panels with Escape key
    markers.forEach(m => m.setIcon(defaultIcon));
    document.querySelector('.bottom-right').innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        <h3>Full Transcription</h3>
        <p>Paper transcription will appear when hovering over markers</p>
        <h3>Full Transcription</h3>
        <p>Paper transcription will appear when hovering over markers</p>
      </div>
    `;
  }
});

// Initialize the map controls when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Create the filter control and stats display
  createMapFilterControl();
  createMapStats();

  // Initialize with welcome message
  document.querySelector('.bottom-right').innerHTML = `
    <div style="text-align: center; color: #666; padding: 20px;">
      <h3>Getting Started</h3>
      <p>Hover over markers to explore paper details</p>
    </div>
  `;
});

console.log('Ancient Stones Project - Enhanced Map with Hover Information Loaded');
console.log('Hover over markers to view paper details, click to zoom to location');


//---------------------------------------------------
// initialize the top-right module
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await fetchItems();
    displayList();
    const top_right_list = document.querySelector('#top-right-list');
    if (top_right_list) {
      top_right_list.addEventListener('click', handleListClick);
    }
  }
  catch (error) {
    console.error('display list in top-right failed');
  }
})


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

//module 'middle'
document.addEventListener('idsShared', (event) => {
  if (event.detail.module === 'middle') {
    //self trigger event, ignore it 
    return;
  }
  const ids_received = event.detail.ids;

  // handle ids_reveived for 'middle' module
  // TODO


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
