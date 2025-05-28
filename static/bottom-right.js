import { dispatch_shared_ids } from "./script.js";

fetch(`/items/0`)
    .then(res => res.json())
    .then(item => {
        if (item.error) throw new Error(item.error);
        renderVisualization(item);
    })
    .catch(err => console.error('Failed to load default item:', err));

export function handleIdsDetails(event) {
    if (event.detail.module === 'bottom-right') {
        //self trigger event, ignore it 
        return;
    }
    const ids_received = event.detail.ids;

    const selectedId = ids_received[0];

    fetch(`/items/${selectedId}`) 
        .then(res => res.json())
        .then(item => {
            if (item.error) throw new Error(item.error);
            // console.log(item)
            renderVisualization(item);
        })
        .catch(err => console.error('Failed to load item:', err));

}

function renderVisualization(bietie) {
    // Clear previous content
    const container = d3.select('#bottom-right-details')
        .html('')
        .style('overflow-y', 'auto')  // Enable vertical scrolling
        .style('height', '90%')     
    
    // Add title
    container.append('h1')
        .attr('class', 'bietie-title')
        .text(`《${bietie.name}》`);
    
    const mainContainer = container.append('div')
        .attr('class', 'main-container');

    const imageContainer = mainContainer.append('div')
        .attr('class', 'image-container');

    imageContainer.append('img')
        .attr('src', `/data/pictures/${bietie.id}.jpg`)
        .attr('alt', bietie.name)
        .attr('class', 'bietie-image');

    const contentContainer = mainContainer.append('div')
        .attr('class', 'content-container');

    const steleDiv = contentContainer.append('div')
        .attr('class', 'stele-info');

    // Process authors
    const authors = bietie.authors || [];
    const authorText = authors.map(a => {
        return `<span class="author-link" data-id="${a.id}">${a.author}</span> (${a.role})`;
    }).join('、');

    // Add authors 
    if (authorText && authorText.trim() !== ''){
        steleDiv.append('p')
            .html(`<strong>作者:</strong> ${authorText}`);
    }

    // Author click handler
    steleDiv.selectAll('.author-link')
        .on('click', function() {
            const authorId = d3.select(this).attr('data-id');
            
            // Fetch author details and works
            fetch(`/authors/${authorId}`)
                .then(response => response.json())
                .then(author => {
                    if (author.error) throw new Error(author.error);
                    
                    // Extract work IDs from author's works
                    const workIds = author.works.map(work => work.id);
                    
                    if (workIds.length > 0) {
                        // Dispatch to other modules (3 = bottom-right module index)
                        dispatch_shared_ids(workIds, 3);
                    } else {
                        console.log('No items found for this author');
                    }
                })
                .catch(error => {
                    console.error('Failed to load author:', error);
                    // show error to user
                    d3.select('#bottom-right-details')
                        .append('div')
                        .attr('class', 'error')
                        .text('加载作者信息失败');
                });
        });


    if (bietie.calligraphyStyle !== "unknown") {
        steleDiv.append('p')
            .html(`<strong>书体:</strong> ${bietie.calligraphyStyle}`);
    }


    if (bietie.stele.temporal !== "unknown") {
        steleDiv.append('p')
            .html(`<strong>刻立朝代:</strong> ${bietie.stele.temporal}`);
    }

    if (bietie.stele.temporalValue !== "unknown") {
        steleDiv.append('p')
            .html(`<strong>刻立时代:</strong> ${bietie.stele.temporalValue}`);
    }

    if (bietie.stele.creationPlace !== "unknown") {
        steleDiv.append('p')
            .html(`<strong>刻立地点：</strong> ${bietie.stele.creationPlace}`);
    }

    // Rubbing details
    const rubbingDiv = container.append('div')
        .attr('class', 'rubbing-section');

    rubbingDiv.append('h2')
        .attr('class', 'section-header')
        .text('帖详细');

    const rubbingInfo = rubbingDiv.append('div')
        .attr('class', 'rubbing-info-container');

    if (bietie.temporal !== "unknown") {
        rubbingInfo.append('p')
            .html(`<strong>刻印朝代:</strong> ${bietie.temporal}`);
    }

    if (bietie.temporalValue !== "unknown") {
        rubbingInfo.append('p')
            .html(`<strong>刻印朝代:</strong> ${bietie.temporalValue}`);
    }

    if (bietie.details.edition !== "unknown") {
        rubbingInfo.append('p')
            .html(`<strong>版本:</strong> ${bietie.details.edition}`);
    }

    if (bietie.details.binding !== "unknown") {
        rubbingInfo.append('p')
            .html(`<strong>装帧:</strong> ${bietie.details.binding}`);
    }

    if (bietie.details.text !== "unknown") {
        const rubbingContentDiv = container.append('div')
            .attr('class', 'rubbing-section');

        rubbingContentDiv.append('h2')
            .attr('class', 'section-header')
            .text('帖内容');

        const scrollableContent = rubbingContentDiv.append('div')
            .attr('class', 'scrollable-content-container')
            .html(bietie.details.text.replace(/\r\n/g, '<br/>'));
    }
}