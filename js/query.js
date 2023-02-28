function $(query) {
    if (query.includes("#")) return document.querySelector(query);
    return document.querySelectorAll(query);
}
// https://help.waterdata.usgs.gov/faq/automated-retrievals#Examples

const granularity = 1;
let annotations = [];
let myGraph;
let timeRange;

init("02098197", 1);

async function init(siteID, days) {
    timeRange = days;
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
            myGraph.update();
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
            // return (new Date(dataPoint.dateTime)).toLocaleString();
            return dataPoint.dateTime;
        });
        // labels = labels.filter((elem, index) => {
        //     return index % granularity == 0;
        // });

        let data = dataPoints.map((dataPoint) => {
            return parseFloat(dataPoint.value);
        });
        let scrunched = data.filter((elem, index) => {
            return index % granularity == 0;
        });

        let obj = { label, data: scrunched, hidden: false };
        // console.log(obj);
        datasets.push(obj);
    }
    datasets[0].hidden = false;
    // FIXME: Hardcoded
    datasets[0].yAxisID = 'y1';
    return { labels, datasets };
}

function makeGraph(ctx, labels, datasets) {
    const options = {
        scales: {
            y: {
                beginAtZero: false,
                position: 'right',
            },
            // TODO: Make it so y-axis stays relative https://www.chartjs.org/docs/latest/samples/line/multi-axis.html
            y1: {
                beginAtZero: false,
                type: 'linear',
                display: true,
                position: 'left',

                // grid line settings
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
            },
            x: {
                type: 'time',
                time: {
                    unit: 'hour',
                    displayFormats: {
                        'hour': 'hh a',
                        'day': 'MMM dd',
                        'week': 'MMM dd',
                        'month': 'MMM dd',
                        'quarter': 'MMM dd',
                        'year': 'MMM dd',
                    }
                },
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
                // FIXME: https://www.chartjs.org/docs/latest/configuration/decimation.html
                enabled: true,
                threshold: 1,
            },
            annotation: {
                drawTime: "afterDraw",
                annotations
            }
        },
        // /*FIXME:*/ parsing: false,
    };
    myGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets,
        },
        options
    });
}

function addBoxAnnotation(info) {
    let it = new Image();
    it.src = info["EVT_IMAGE"];
    let anno = {
        id: info["EVT_TITLE"],
        type: 'box',
        label: {
            content: [info["EVT_TITLE"], info["EVT_DESC"], it],
            /*TODO:*/display: true,
        },
        xMin: info["EVT_STARTDATE"] * 1000,
        xMax: info["EVT_ENDDATE"] * 1000,
        backgroundColor: 'rgba(255, 99, 132, 0.25)',
        enter: function ({ element }) {
            return true;
        },
        click: function ({ chart, element }) {
            console.log(element);
            myGraph.update();
            return true;
        },
        leave: function ({ element }) {
            return true;
        },
        display: false,
    };
    if (myGraph.scales.x.max > anno.xMax && anno.xMax > myGraph.scales.x.min) {
        // At least showing on left of graph so display
        anno.display = true;
        if (anno.xMin < myGraph.scales.x.min) {
            // The left side of range is off the graph so trim
            anno._xMin = anno.xMin;
            anno.xMin = myGraph.scales.x.min;
        }
    } else if (myGraph.scales.x.min < anno.xMin && anno.xMin < myGraph.scales.x.max) {
        // At least showing on right of graph so display
        anno.display = true;
        if (anno.xMax > myGraph.scales.x.max) {
            // The right side of range is off the graph so trim
            anno._xMax = anno.xMin;
            anno.xMax = myGraph.scales.x.max;
        }
    }
    annotations.push(anno);
}

function toggleLegendClickHandler(e, legendItem, legend) {
    let index = legendItem.datasetIndex;
    
    const ci = legend.chart;
    if (ci.isDatasetVisible(index)) {
        ci.hide(index);
        legendItem.hidden = false;
    } else {
        ci.show(index);
        legendItem.hidden = true;
    }

    // let numShowing = myGraph.getVisibleDatasetCount();
    // if (numShowing > 1) {
    //     myGraph.options.scales.y1.display = true;
    // } else {
    //     myGraph.options.scales.y1.display = false;
    // }

    myGraph.update();
}