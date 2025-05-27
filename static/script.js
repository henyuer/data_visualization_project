import { fetchItems, displayList, handleListClick, handleIdsSharedM2 } from "./top-right.js";
import { ChineseCalligraphyMap } from "./map.js";

// Initialize map instance
let chineseMap = null;

// Initialize the map when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Initialize the map
  chineseMap = new ChineseCalligraphyMap('china-map');
  chineseMap.init();
});

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

//module 'middle' (map)
document.addEventListener('idsShared', (event) => {
  if (event.detail.module === 'middle') {
    //self trigger event, ignore it 
    return;
  }
  const ids_received = event.detail.ids;

  // Handle IDs for map module
  if (chineseMap && Array.isArray(ids_received)) {
    if (ids_received.length === 0) {
      // Empty array - reset to show all markers
      chineseMap.resetMarkers();
    } else if (ids_received.length === 1) {
      // Single ID - highlight only this marker, dim others
      chineseMap.highlightMarkersByIds(ids_received);
    } else {
      // Multiple IDs - filter to show only these markers
      chineseMap.filterMarkersByIds(ids_received);
    }
  }
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

//module 'middle' (map) - handled by ChineseCalligraphyMap class
// Map interactions are now encapsulated in the map.js module

//  module 'top-right'
// implemented in the module's initialization

// module 'bottom-right'
const module_bottom_right = document.querySelector('.bottom-right');
// TODO for 'bottom-right' interaction
