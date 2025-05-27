// map.js - Dedicated module for map functionality
class ChineseCalligraphyMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = [];
    this.allItemsData = [];
    this.allAuthorsData = [];
    this.allMapData = [];

    this.initializeMap();
    this.loadData();
  }

  initializeMap() {
    this.map = L.map(this.containerId).setView([32, 104], 4);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);
  }

  // Icon definitions - now using consistent iconSize and iconAnchor
  // The visual changes for default/hover will be handled by CSS
  get defaultOrHoverIcon() {
    return L.divIcon({
      className: 'custom-marker', // The base class for default and hover states
      html: `<div class="marker-inner"></div>`, // Inner div for styling
      iconSize: [22, 22], // Consistent size for all markers
      iconAnchor: [11, 11] // Anchor to the center of the consistent size
    });
  }

  get greyIcon() {
    return L.divIcon({
      className: 'custom-marker grey', // Add 'grey' class for dimmed state
      html: `<div class="marker-inner"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  get highlightIcon() {
    return L.divIcon({
      className: 'custom-marker highlighted', // Add 'highlighted' class for active state
      html: `<div class="marker-inner"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  // Process items data for map display
  processItemsForMap(items, authors) {
    const mapData = [];

    // Create author lookup
    const authorLookup = {};
    authors.forEach(author => {
      authorLookup[author.id] = author;
    });

    // Process items to extract geographic data
    items.forEach(item => {
      if (item.authors && item.authors.length > 0) {
        item.authors.forEach(authorInfo => {
          const author = authorLookup[authorInfo.id];
          if (author && author.place && author.place.location !== "unknown") {
            const [lat, lng] = author.place.location.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
              mapData.push({
                id: item.id,
                title: item.name,
                museum: author.place.city + "博物馆",
                location_found: author.place.city,
                latitude: lat,
                longitude: lng,
                text: item.details && item.details.text ? item.details.text.substring(0, 200) + "..." : "古代书法作品",
                region: author.place.province,
                calligraphyStyle: item.calligraphyStyle,
                temporal: item.temporalValue || item.temporal,
                author: author.name,
                authorRole: authorInfo.role
              });
            }
          }
        });
      }
    });

    return mapData;
  }

  // Load data from server
  async loadData() {
    try {
      const [itemsData, authorsData] = await Promise.all([
        fetch('/items').then(response => response.json()),
        fetch('/authors').then(response => response.json())
      ]);

      this.allItemsData = itemsData;
      this.allAuthorsData = authorsData;
      this.allMapData = this.processItemsForMap(itemsData, authorsData);

      console.log(`Loaded ${this.allMapData.length} calligraphy works with geographic data`);

      this.createControls();
      this.renderMarkers(this.allMapData);
      this.updateStats(this.allMapData.length, this.allMapData.length);

    } catch (error) {
      console.error('Error fetching calligraphy data:', error);
      this.updateStats(0, 0, 'Error loading data');
    }
  }

  // Create map controls
  createControls() {
    // Filter control
    const filterControl = document.createElement('div');
    filterControl.className = 'map-filter-control';
    filterControl.innerHTML = `
      <label for="map-region-select">Filter by Region</label>
      <select id="map-region-select">
        <option value="">All Regions</option>
      </select>
    `;

    // Stats control
    const statsControl = document.createElement('div');
    statsControl.className = 'map-stats';
    statsControl.id = 'map-stats';
    statsControl.innerHTML = 'Loading...';

    // Add controls to map container
    const mapContainer = document.getElementById(this.containerId);
    mapContainer.appendChild(filterControl);
    mapContainer.appendChild(statsControl);

    // Populate dropdown and add event listener
    this.populateRegionDropdown();
  }

  // Populate region dropdown
  populateRegionDropdown() {
    const select = document.getElementById('map-region-select');
    const regions = [...new Set(this.allMapData.map(item => item.region))].sort();

    select.innerHTML = `<option value="">All Regions</option>`;

    regions.forEach(region => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      select.appendChild(option);
    });

    // Add event listener for filtering
    select.addEventListener('change', () => {
      const region = select.value;
      const filtered = region
        ? this.allMapData.filter(item => item.region === region)
        : this.allMapData;

      // Smooth transition
      const mapElement = document.getElementById(this.containerId);
      mapElement.style.opacity = '0.8';

      setTimeout(() => {
        this.renderMarkers(filtered);
        mapElement.style.opacity = '1';
        this.updateStats(this.allMapData.length, filtered.length, region);
      }, 200);
    });
  }

  // Render markers on map
  renderMarkers(data) {
    // Clear existing markers
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    data.forEach(item => {
      const marker = L.marker([item.latitude, item.longitude], {
        icon: this.defaultOrHoverIcon, // Use the single icon for default/hover
        itemId: item.id // Store item ID for reference
      }).addTo(this.map);

      // Create popup content
      const popupContent = `
        <div style="font-family: Arial, sans-serif; max-width: 250px;">
          <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
            ${item.title}
          </h4>
          <div style="margin-bottom: 8px;">
            <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
              <strong>Museum:</strong> ${item.museum}
            </p>
            <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
              <strong>Found in:</strong> ${item.location_found}
            </p>
            <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
              <strong>Region:</strong> ${item.region}
            </p>
            ${item.calligraphyStyle ? `
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
                <strong>书体:</strong> ${item.calligraphyStyle}
              </p>
            ` : ''}
            ${item.temporal ? `
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
                <strong>朝代:</strong> ${item.temporal}
              </p>
            ` : ''}
            ${item.author ? `
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
                <strong>作者:</strong> ${item.author} (${item.authorRole})
              </p>
            ` : ''}
          </div>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #888; line-height: 1.4;">
            ${item.text ? item.text.substring(0, 100) + '...' : 'Click marker for details'}
          </p>
          <div style="border-top: 1px solid #eee; padding-top: 6px;">
            <p style="margin: 0; font-size: 10px; color: #999;">
              Hover for details, click to select
            </p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Mouseover/mouseout are handled by CSS :hover now for the custom-marker class.
      // We only need to open/close popups here.
      marker.on('mouseover', () => {
        marker.openPopup();
      });

      marker.on('mouseout', () => {
        marker.closePopup();
      });


      // Add click handler for selection and sharing with other modules
      marker.on('click', (e) => {
        // Prevent event bubbling to map
        L.DomEvent.stopPropagation(e);

        console.log('Marker clicked! Item:', item.title, 'ID:', item.id);

        // Immediately dispatch selection to other modules
        const idToSend = item.id.toString();
        this.dispatchMapSelection([idToSend]);

        // Immediately highlight this marker and dim others
        this.highlightMarkersByIds([item.id]);

        // Zoom to location without animation delay
        this.map.setView([item.latitude, item.longitude], Math.max(this.map.getZoom(), 7), {
          animate: false
        });

        console.log('Dispatched ID immediately:', idToSend);
      });

      this.markers.push(marker);
    });
  }

  // Update stats display
  updateStats(total, filtered, region = null) {
    const statsElement = document.getElementById('map-stats');
    if (statsElement) {
      if (region && region !== 'Error loading data') {
        statsElement.innerHTML = `Showing ${filtered} of ${total} works • Region: ${region}`;
      } else if (region === 'Error loading data') {
        statsElement.innerHTML = 'Error loading data';
      } else {
        statsElement.innerHTML = `Showing ${total} calligraphy works • All regions`;
      }
    }
  }

  // Add keyboard shortcuts
  addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Reset all markers
        this.resetMarkers();
      }
    });
  }

  // Debug method to check what IDs are available on the map
  getAvailableIds() {
    const availableIds = this.allMapData.map(item => item.id);
    console.log('Available IDs on map:', availableIds);
    return availableIds;
  }

  // Public method to get map data (for other modules)
  getMapData() {
    return this.allMapData;
  }

  // Public method to filter markers by IDs (for module communication)
  filterMarkersByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      // If no IDs or empty array, show all markers
      this.renderMarkers(this.allMapData);
      this.updateStats(this.allMapData.length, this.allMapData.length);
      return;
    }

    // Convert IDs to numbers for comparison (handle both string and number IDs)
    const numericIds = ids.map(id => parseInt(id, 10));
    const filtered = this.allMapData.filter(item => numericIds.includes(item.id));

    this.renderMarkers(filtered);
    this.updateStats(this.allMapData.length, filtered.length, 'Filtered by selection');
  }

  // Public method to highlight specific markers without filtering others
  highlightMarkersByIds(ids) {
    if (!Array.isArray(ids)) return;

    const numericIds = ids.map(id => parseInt(id, 10));
    console.log('Highlighting markers with IDs:', numericIds);

    let highlightedCount = 0;
    this.markers.forEach(marker => {
      const markerId = parseInt(marker.options.itemId, 10);

      if (numericIds.includes(markerId)) {
        // Highlight the marker
        marker.setIcon(this.highlightIcon);
        marker.options.isHighlighted = true;
        highlightedCount++;
        console.log('Highlighted marker ID:', markerId);
      } else {
        // Set to grey/dimmed
        marker.setIcon(this.greyIcon);
        marker.options.isHighlighted = false;
      }
    });

    console.log(`Highlighted ${highlightedCount} out of ${this.markers.length} markers`);
  }

  // Public method to reset all markers to default state
  resetMarkers() {
    this.markers.forEach(marker => {
      marker.setIcon(this.defaultOrHoverIcon); // Use the base icon that has default/hover CSS
      marker.options.isHighlighted = false;
    });
  }

  // Public method to dispatch IDs from map interactions (for sharing with other modules)
  dispatchMapSelection(ids) {
    // Use setTimeout to ensure event is dispatched after current call stack
    setTimeout(() => {
      const event = new CustomEvent('idsShared', {
        detail: {
          ids: ids,
          module: 'middle' // This map is the 'middle' module
        },
        bubbles: true
      });

      // Dispatch the event
      document.dispatchEvent(event);
      console.log('Map dispatched IDs:', ids);
    }, 0);
  }

  // Initialize all features
  init() {
    this.addKeyboardShortcuts();

    // Add map click handler to reset markers (but not when clicking on markers)
    this.map.on('click', (e) => {
      // Only reset if clicking on empty map space, not on markers
      if (!e.originalEvent.target.closest('.leaflet-marker-icon')) {
        console.log('Map background clicked - resetting markers');
        this.resetMarkers();

        // Optionally dispatch empty array to reset other modules
        this.dispatchMapSelection([]);
      }
    });

    console.log('Chinese Calligraphy Map initialized with', this.allMapData.length, 'items');
  }
}

// Export for use in other modules
export {
  ChineseCalligraphyMap
};