import { dispatch_shared_ids } from "./script.js";

export function handleIdsDetails(event) {
    if (event.detail.module === 'bottom-right') {
        //self trigger event, ignore it 
        return;
    }
    const ids_received = event.detail.ids;

    const selectedId = ids_received[0]; // by default print out the first one


    fetch(`/items/${0}`) 
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
    d3.select('#bottom-right-details').html('');
    
    // Add title
    d3.select('#bottom-right-details').append('h1')
        .attr('class', 'bietie-title')
        .text(`《${bietie.name}》`);
    
    const contentContainer = d3.select('#bottom-right-details').append('div')
        .attr('class', 'content-container');

    const steleDiv = contentContainer.append('div')
        .attr('class', 'stele-info');

    // Process authors
    const authors = bietie.authors || [];
    const authorText = authors.map(a => {
        return `<span class="author-link" data-id="${a.id}">${a.author}</span> (${a.role})`;
    }).join('、');

    // Add authors 
    if (authorText && authorText.trim() !== '') {
        steleDiv.append('p')
            .html(`<strong>作者:</strong> ${authorText}`);
    }

    // Author click handler
    steleDiv.selectAll('.author-link')
        .on('click', function() {
            const authorId = d3.select(this).attr('data-id');
            // You can add more detailed author information here
            d3.select('#bottom-right-details').html('');
            d3.select('#bottom-right-details').append('h2')
                .text('Author Details');
            d3.select('#bottom-right-details').append('p')
                .text(`Author ID: ${authorId}`);
            // Add more author details as needed
        });

    if (bietie.calligraphyStyle !== "unknown") {
        steleDiv.append('p')
            .html(`<strong>书体:</strong> <span class="style-link">${bietie.calligraphyStyle}</span>`);

        // Style click handler
        steleDiv.select('.style-link')
            .on('click', function() {
                const styleText = d3.select(this).text();
                d3.select('#bottom-right-details').html('');
                d3.select('#bottom-right-details').append('h2')
                    .text('Calligraphy Style Details');
                d3.select('#bottom-right-details').append('p')
                    .text(`Style: ${styleText}`);
                // Add more style details as needed
            });
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
    const rubbingDiv = contentContainer.append('div')
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
        const rubbingContentDiv = contentContainer.append('div')
            .attr('class', 'rubbing-section');

        rubbingContentDiv.append('h2')
            .attr('class', 'section-header')
            .text('帖内容');

        const scrollableContent = rubbingContentDiv.append('div')
            .attr('class', 'scrollable-content-container')
            .html(bietie.details.text.replace(/\r\n/g, '<br/>'));
    }
}