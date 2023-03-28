let annotations = [];
let myGraph;
let GRAPHING = false;
let MIN_MAX_TIME = [];

async function graphTimeSeries(elem) {
    if (GRAPHING) return;
    GRAPHING = true;
    toggleLoader();
    
    if (myGraph != undefined) myGraph.destroy();
    annotations = [];
    $("#name").innerText = "";
    $("#description").innerText = "";

    let meta = JSON.parse(elem.dataset.json);
    let office = meta.office;
    let siteID = meta.name;

    let dB = await queryDB();

    let res = await queryAPI(office, siteID);
    res = res["time-series"];

    if (res['query-info']['total-time-series-retrieved'] == 0) {
        $("#name").innerText = "Please try another time series!"
        console.error("No Data!");
    } else if (res["time-series"][0].error) {
        console.error(res["time-series"][0].error);
    } else {
        const ctx = $('#myChart');
        let { labels, datasets } = parseData(res);
        makeGraph(ctx, labels, datasets);

        // if (siteID in dB["WATER_SITES"]) {
        //     $("#name").innerText = dB["WATER_SITES"][siteID]["SITE_NAME"];
        //     $("#description").innerText = dB["WATER_SITES"][siteID]["SITE_DESC"];
        // }
        // if (siteID in dB["EVENT_SITES"]) {
        //     for (let annotation of dB["EVENT_SITES"][siteID]) {
        //         let evt_id = annotation["EVT_ID"];
        //         evt_id = 0;
        //         let info = dB["HISTORICAL_EVENTS"][evt_id];
        //         addBoxAnnotation(info);
        //         myGraph.update();
        //     }
        // }
    }
    
    toggleLoader();
    GRAPHING = false;
}

async function queryAPI(office, name) {
    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/timeseries?office=${office}&name=${encodeURIComponent(name)}&begin=PT-${24}h`);
    const res = await fetch(query);
    let data = await res.json();
    return data;
}
async function queryDB() {
    const dBQuery = new Request("https://mregan-capstone-default-rtdb.firebaseio.com/HISTORICAL_EVENTS.json/?");
    let dB = await fetch(dBQuery);
    dB = await dB.json();
    return dB;
}

// function addBoxAnnotation(info) {
//     let it = new Image();
//     it.src = info["EVT_IMAGE"];
//     let anno = {
//         id: info["EVT_TITLE"],
//         type: 'box',
//         label: {
//             content: [info["EVT_TITLE"], info["EVT_DESC"], it],
//             /*TODO:*/display: true,
//         },
//         xMin: info["EVT_STARTDATE"] * 1000,
//         xMax: info["EVT_ENDDATE"] * 1000,
//         backgroundColor: 'rgba(255, 99, 132, 0.25)',
//         enter: function ({ element }) {
//             return true;
//         },
//         click: function ({ chart, element }) {
//             myGraph.update();
//             return true;
//         },
//         leave: function ({ element }) {
//             return true;
//         },
//         display: false,
//     };
//     if (myGraph.scales.x.max > anno.xMax && anno.xMax > myGraph.scales.x.min) {
//         // At least showing on left of graph so display
//         anno.display = true;
//         if (anno.xMin < myGraph.scales.x.min) {
//             // The left side of range is off the graph so trim
//             anno._xMin = anno.xMin;
//             anno.xMin = myGraph.scales.x.min;
//         }
//     } else if (myGraph.scales.x.min < anno.xMin && anno.xMin < myGraph.scales.x.max) {
//         // At least showing on right of graph so display
//         anno.display = true;
//         if (anno.xMax > myGraph.scales.x.max) {
//             // The right side of range is off the graph so trim
//             anno._xMax = anno.xMin;
//             anno.xMax = myGraph.scales.x.max;
//         }
//     }
//     annotations.push(anno);
// }

function makeGraph(ctx, labels, datasets) {
    const options = {
        scales: {
            y: {
                beginAtZero: false,
                position: 'left',
            },
            x: {
                min: MIN_MAX_TIME[0],
                max: MIN_MAX_TIME[1],
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
            datasets: datasets,
        },
        options
    });
}

function parseData(data) {
    let timeSeries = data["time-series"][0];
    let datasets = [];
    let labels;
    let label = timeSeries.name;

    // Will have either "regular-interval-values" or "irregular-interval-values"
    let intervalRegularity = "regular-interval-values";
    if (timeSeries[intervalRegularity] == undefined) intervalRegularity = "irregular-interval-values";

    if (intervalRegularity == "regular-interval-values") {
        const segment = timeSeries[intervalRegularity].segments[0];
        const comment = segment.comment.split(", ");
        const startTime = new Date(segment["first-time"]);
        const lastTime = new Date(segment["last-time"]);
        MIN_MAX_TIME = [startTime, lastTime];
        let values = segment.values;
        
        let checkTime = startTime.addHours(0);

        labels = [];
        for (let i = 0; i < segment["value-count"]; i++) {
            labels.push(checkTime.addHours(i));
        }

        values = values.map((dataPoint) => {
            return dataPoint[0];
        });

        console.log(data)
        console.log(labels)
        
        let obj = { label, data: values, hidden: false };
        datasets.push(obj);
    } 
    

    else if (intervalRegularity == "irregular-interval-values") {
        // TODO: irregular interval graphing
    }
    return { labels, datasets };
}

// // FIXME: need more than just addHours (it can also be days, months, etc)
Date.prototype.addHours = function(hours) {
    var date = new Date(this.valueOf());
    date.setHours(date.getHours() + hours);
    return date;
}
