import { dispatch_shared_ids } from "./script.js";

let fullWorkList = [];
let currentWorkList = [];

function clearList(listElement) {
    listElement.innerHTML = "";
}

export function displayList() {
    const listElement = document.getElementById('top-right-list');
    if (!listElement) {
        console.error('can not find top-right-list');
        return;
    }
    clearList(listElement);
    currentWorkList.forEach(work => {
        const listItem = document.createElement('li');
        listItem.textContent = work['name'];
        listItem.dataset.id = work.id;
        listElement.appendChild(listItem);
    })
}


export async function fetchItems() {
    try {
        const response = await fetch('/items')
        if (!response.ok) {
            throw new Error('Network response failed');
        }
        const data = await response.json();
        data.forEach(element => {
            fullWorkList.push({ 'id': element['id'], 'name': element['name'] })
        });
        currentWorkList = [...fullWorkList];
    }
    catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

export function handleListClick(event) {
    const clickedLi = event.target.closest('li');

    if (clickedLi && event.currentTarget.contains(clickedLi)) {

        const id = clickedLi.dataset.id;
        dispatch_shared_ids([id], 2);
    }

}

export function handleIdsSharedM2(event) {
    if (event.detail.module === 'top-right') {
        //self trigger event, ignore it 
        return;
    }
    const ids_received = event.detail.ids;
    currentWorkList.length = 0;
    ids_received.forEach(id => {
        //assume id start from 0 and constently plus 1
        currentWorkList.push({ 'id': id, 'name': fullWorkList[id]['name'] });
    })
    displayList();
}