function $(query) {
    if (query.includes("#")) return document.querySelector(query);
    return document.querySelectorAll(query);
}

// https://help.waterdata.usgs.gov/faq/automated-retrievals#Examples

const granularity = 1;
let annotations = [];
let myGraph;

// init("02098197");

async function init(siteID, days) {
    if (myGraph != undefined) {
        myGraph.destroy();
        annotations = [];
        $("#name").innerText = "";
        $("#description").innerText = "";
    }
    let dB = await queryDB();
    let response = await queryAPI(siteID, days);

    const ctx = document.getElementById('myChart');
    let { labels, datasets } = parseData(response);
    makeGraph(ctx, labels, datasets);

    console.log(dB);

    if (siteID in dB["WATER_SITES"]) {
        $("#name").innerText = dB["WATER_SITES"][siteID]["SITE_NAME"];
        $("#description").innerText = dB["WATER_SITES"][siteID]["SITE_DESC"];
    }
    if (siteID in dB["EVENT_SITES"]) {
        for (let annotation of dB["EVENT_SITES"][siteID]) {
            let evt_id = annotation["EVT_ID"];
            // FIXME: Each object in the dB["EVENT_SITES"][siteID] array should contain the event's id.
            evt_id = 0;
            // FIXME: HISTORICAL_EVENTS should be an object containing objects, not an array. Then each can be identified and accessed by its id.
            let info = dB["HISTORICAL_EVENTS"][evt_id];
            console.log(info)
            addBoxAnnotation(info);
        }
    }
}


async function queryAPI(id, days) {
    const query = new Request(`https://waterservices.usgs.gov/nwis/iv/?sites=${id}&period=P${days}D&format=json`);
    let response = await fetch(query);
    response = await response.json();
    return response;
}

async function queryDB() {
    const dBQuery = new Request("https://mregan-capstone-default-rtdb.firebaseio.com/.json/?");
    let dB = await fetch(dBQuery);
    dB = await dB.json();
    return dB;
}

function parseData(json) {
    let datasets = [];
    let labels;
    console.log(json)
    for (let i in json.value.timeSeries) {
        let cur = json.value.timeSeries[i];
        let label = cur.variable.variableName;
        let dataPoints = cur.values[0].value;
        if (cur["sourceInfo"]["siteName"]) {
            $("#name").innerText = cur["sourceInfo"]["siteName"];
        }

        labels = dataPoints.map((dataPoint) => {
            return (new Date(dataPoint.dateTime)).toLocaleString();
        });
        labels = labels.filter((elem, index) => {
            return index % granularity == 0;
        });

        let data = dataPoints.map((dataPoint) => {
            return parseFloat(dataPoint.value);
        });
        let scrunched = data.filter((elem, index) => {
            return index % granularity == 0;
        });

        let obj = { label, data: scrunched, hidden: true };
        // console.log(obj);
        datasets.push(obj);
    }
    datasets[0].hidden = false;
    return { labels, datasets };
}

function makeGraph(ctx, labels, datasets) {
    const options = {
        scales: {
            y: {
                beginAtZero: false
            }
        },
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                onClick: toggleLegendClickHandler
            },
            decimation: {
                enabled: false,
                threshold: 1,
            },
            annotation: {
                drawTime: "afterDraw",
                annotations
            }
        },
    };
    myGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options
    });
}

function addBoxAnnotation(info) {
    // FIXME: Display only if time on graph
    // TODO: Should have popup info or something
    let anno = {
        id: info["EVT_TITLE"],
        type: 'box',
        xMin: (new Date(info["EVT_STARTDATE"]*1000)).toLocaleString(),
        xMax: (new Date(info["EVT_ENDDATE"]*1000)).toLocaleString(),
        yMin: myGraph.scales.min,
        yMax: myGraph.scales.max,
        backgroundColor: 'rgba(255, 99, 132, 0.25)',
        enter: function ({ element }) {
            console.log(element);
            element.options.backgroundColor = "#00ff00";
            return true;
        },
        click: function ({ chart, element }) {
            return true;
        },
        leave: function ({ element }) {
            element.options.backgroundColor = "#ff0000";
            return true;
        },
    };
    annotations.push(anno);
}

function toggleLegendClickHandler(e, legendItem, legend) {
    let index = legendItem.datasetIndex;
    console.log("legendItem.datasetIndex: " + index);
    const ci = legend.chart;
    for (let i = 0; i < legend.legendHitBoxes.length; i++) {
        ci.hide(i);
        legendItem.hidden = true;
    }
    ci.show(index);
    legendItem.hidden = false;
}