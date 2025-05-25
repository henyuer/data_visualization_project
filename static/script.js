const map = L.map('china-map').setView([32, 104], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let selectedMarker = null;

// icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// For testing, use defaultIcon for all states
const greyIcon = defaultIcon;
const highlightedIcon = defaultIcon;


let allPaperData = [];

fetch('/papers')
  .then(response => response.json())
  .then(data => {
    allPaperData = data;
    populateRegionDropdown(data); // generate dropdown first
    renderMarkers(data);          // then render markers
  });

function renderMarkers(data) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(paper => {
    const marker = L.marker([paper.latitude, paper.longitude], {
      icon: defaultIcon
    }).addTo(map);

    marker.bindPopup(paper.title);

    marker.on('click', () => {
      markers.forEach(m => m.setIcon(m === marker ? highlightedIcon : greyIcon));
      selectedMarker = marker;

      document.querySelector('.top-right').innerHTML = `
        <h3>${paper.title}</h3>
        <p><strong>Museum:</strong> ${paper.museum}</p>
        <p><strong>Found in:</strong> ${paper.location_found}</p>
      `;
      document.querySelector('.bottom-right').innerText = paper.text;
    });

    markers.push(marker);
  });
}

// reset markers when clicking empty map space
map.on('click', () => {
  markers.forEach(m => m.setIcon(defaultIcon));
  selectedMarker = null;
  document.querySelector('.top-right').innerHTML = "Selected Paper Info";
  document.querySelector('.bottom-right').innerHTML = "Full Transcription";
});

// Generate dropdown options from data
function populateRegionDropdown(data) {
  const select = document.getElementById('region-select');
  const regions = [...new Set(data.map(p => p.region))].sort();

  // clear previous options (except "All")
  select.innerHTML = `<option value="">All Regions</option>`;

  regions.forEach(region => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    select.appendChild(option);
  });

  // Event listener
  select.addEventListener('change', () => {
    const region = select.value;
    const filtered = region
      ? allPaperData.filter(p => p.region === region)
      : allPaperData;
    renderMarkers(filtered);
  });
}
