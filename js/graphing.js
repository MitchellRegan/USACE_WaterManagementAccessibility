let annotations = [];
let myGraph;

/**
 */
async function graphTimeSeries(elem) {
    toggleLoader();
    if (myGraph != undefined) {
        // TODO: overlay instead of destroy
        myGraph.destroy();
        annotations = [];
        $("#name").innerText = "";
        $("#description").innerText = "";
    }
    let meta = JSON.parse(elem.dataset.json);
    console.log(meta);
    let office = meta.office;
    let siteID = meta.name;
    let dB = await queryDB();
    console.log(dB); // FIXME:
    let res = await queryAPI(office, siteID);
    res = res["time-series"];

    if (res["time-series"].length == 0) console.error("No Data!");
    else if (res["time-series"].length > 1) console.error("Too much data?");
    else if (res["time-series"][0].error) console.error(res["time-series"][0].error);

    else {
        const ctx = $('#myChart');
        let { labels, datasets } = parseData(res);
        console.log(labels, datasets)
        makeGraph(ctx, labels, datasets);

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
    toggleLoader();
}

async function queryAPI(office, name) {
    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/timeseries?office=${office}&name=${encodeURIComponent(name)}&begin=PT-${$("#numResults").value || 24}h`);
    const res = await fetch(query);
    let data = await res.json();
    return data;
}
async function queryDB() {
    const dBQuery = new Request("https://mregan-capstone-default-rtdb.firebaseio.com/.json/?");
    let dB = await fetch(dBQuery);
    dB = await dB.json();
    return dB;
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

function makeGraph(ctx, labels, datasets) {
    const options = {
        scales: {
            y: {
                beginAtZero: false,
                position: 'left',
            },
            // TODO: Make it so y-axis stays relative https://www.chartjs.org/docs/latest/samples/line/multi-axis.html
            // y1: {
            //     beginAtZero: false,
            //     type: 'linear',
            //     display: true,
            //     position: 'left',

            //     // grid line settings
            //     grid: {
            //         drawOnChartArea: false, // only want the grid lines for one axis to show up
            //     },
            // },
            x: {
                type: 'time',
                time: {
                    // FIXME: don't always want hour scale
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
            // legend: {
            //     onClick: toggleLegendClickHandler
            // },
            // decimation: {
            //     // FIXME: https://www.chartjs.org/docs/latest/configuration/decimation.html
            //     enabled: true,
            //     threshold: 1,
            // },
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

function parseData(data) {
    let timeSeries = data["time-series"][0];
    console.log(data) // FIXME:
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
        let values = segment.values;
        console.table(values);
        
        let checkTime = startTime.addHours(0);

        labels = [];
        while ((checkTime = checkTime.addHours(1)) < lastTime) {
            labels.push(checkTime.toLocaleString());
        }

        values = values.map((dataPoint) => {
            return dataPoint[0];
        });
        console.log(values)
        
        let obj = { label, data: values, hidden: false };
        datasets.push(obj);
    } else if (intervalRegularity == "irregular-interval-values") {
        // TODO: irregular interval graphing
    }

    // if (data["sourceInfo"]["siteName"]) {
    //     // FIXME:
    //     $("#name").innerText = data["sourceInfo"]["siteName"];
    // }

    // return (new Date(dataPoint.dateTime)).toLocaleString();
    // let scrunched = data.filter((elem, index) => {
    //     return index % granularity == 0;
    // });

    // datasets[0].hidden = false;
    // FIXME: Hardcoded
    // datasets[0].yAxisID = 'y1';
    return { labels, datasets };
}

/**
 * Reference material
 */
// function getTimeSeries(name, office="", hours=24) {
//     const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/timeseries?office=${office}&name=${name}.Elev.Inst.1Hour.0.Decodes-Rev&begin=PT-${hours}h`);
//     fetch(query).then((response) => response.json())
//     .then((json) => {
//         let timeSeries = json["time-series"]["time-series"][0]["regular-interval-values"]["segments"][0]["values"];

//         let firstTime = json["time-series"]["time-series"][0]["regular-interval-values"]["segments"][0]["first-time"];
//         let lastTime = json["time-series"]["time-series"][0]["regular-interval-values"]["segments"][0]["last-time"];
//         firstTime = new Date(firstTime);
//         lastTime = new Date(lastTime);
//         let checkTime = firstTime.addHours(0);

//         let labels = [];
//         while ((checkTime = checkTime.addHours(1)) < lastTime) {
//             labels.push(checkTime.toLocaleString());
//         }

//         timeSeries = timeSeries.map((dataPoint) => {
//             return dataPoint[0];
//         });

//         let label = "Instantaneous Elevation";
//         let obj = {label, data:timeSeries, hidden:false};
//         console.table(timeSeries);
//         console.log(json);
//         graph(labels, [obj]);
//     });
// }

// FIXME: need more than just addHours (it can also be days, months, etc)
Date.prototype.addHours = function(hours) {
    var date = new Date(this.valueOf());
    date.setHours(date.getHours() + hours);
    return date;
}
