let annotations = [];
let myGraph;
let GRAPHING = false;
let MIN_MAX_TIME = [];

// IDEA: Round time to nearest 15 or hour

window.addEventListener('load', () => {
    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    /* remove second/millisecond if needed - credit ref. https://stackoverflow.com/questions/24468518/html5-input-datetime-local-default-value-of-today-and-current-time#comment112871765_60884408 */
    now.setMilliseconds(null)
    now.setSeconds(null)

    $("#endDate").value = now.toISOString().slice(0, -1);
    now.setDate(now.getDate() - 1);
    $("#startDate").value = now.toISOString().slice(0, -1);
});

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
    let dB;

    try {
        dB = await queryDB();
    }
    catch (e) {
        console.warn("Failed to fetch annotations!", e);
    }

    let res;
    try {
        res = await queryAPI(office, siteID);
    } catch (e) {
        $("#name").innerText = "Query Failed! Refresh the page and try again!\nIf the error persists, it may be a server error.";
        GRAPHING = false;
        toggleLoader();
        return;
    }
    res = res["time-series"];

    if (res['query-info']['total-time-series-retrieved'] == 0) {
        $("#name").innerText = "There may be no recorded data for the provided time range."
        console.error("No Data!");
    } else if (res["time-series"][0].error) {
        console.error(res["time-series"][0].error);
        if (res["time-series"][0].error == "Not enough memory for CONNECT BY operation") {
            $("#name").innerText = "Try using a smaller time-range. The API can only handle so much data.";
        }
    } else {
        const ctx = $('#myChart');
        let { labels, datasets, unit } = parseData(res);
        makeGraph(ctx, labels, datasets, unit);

        for (let event of Object.getOwnPropertyNames(dB)) {
            let info = dB[event];
            if (info.EVT_SITES.includes(SELECTED_LOCATION.name)) {
                addBoxAnnotation(info);
                myGraph.update();
            }
        }
    }

    toggleLoader();
    GRAPHING = false;
}

async function queryAPI(office, name) {
    let startDate = $("#startDate").value;
    let endDate = $("#endDate").value;

    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/timeseries?office=${office}&name=${encodeURIComponent(name)}&begin=${startDate}&end=${endDate}`);

    try {
        const res = await fetch(query);
        let data = await res.json();
        return data;
    }
    catch (e) {
        throw Error(e);
    }
}
async function queryDB() {
    const dBQuery = new Request("https://mregan-capstone-default-rtdb.firebaseio.com/HISTORICAL_EVENTS.json/?");
    try {
        let dB = await fetch(dBQuery);
        dB = await dB.json();
        return dB;
    } catch (e) {
        throw Error(e);
    }
}

function addBoxAnnotation(info) {
    let it = info["EVT_IMAGE"];
    let anno = {
        id: info["EVT_TITLE"],
        type: 'box',
        label: {
            content: [info["EVT_TITLE"], "Click here for more info"],
            display: true,
        },
        xMin: info["EVT_STARTDATE"] * 1000,
        xMax: info["EVT_ENDDATE"] * 1000,
        backgroundColor: 'rgba(255, 99, 132, 0.25)',
        enter: function ({ element }) {
            return true;
        },
        click: function ({ chart, element }) {
            $("#annotation_title").innerText = info["EVT_TITLE"];
            $("#annotation_desc").innerText = info["EVT_DESC"];
            $("#annotation_img").src = it;
            toggleAnnotation();
            // myGraph.update();
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

function makeGraph(ctx, labels, datasets, unit) {
    const options = {
        scales: {
            y: {
                beginAtZero: false,
                position: 'left',
                title: {
                    display: true,
                    text: `Measurement Value (${unit})`,
                },
                suggestedMin: Math.floor(Math.min(...datasets[0].data)),
                suggestedMax: Math.ceil(Math.max(...datasets[0].data)),
            },
            x: {
                min: MIN_MAX_TIME[0],
                max: MIN_MAX_TIME[1],
                type: 'time',
                title: {
                    display: true,
                    text: 'Date/Time',
                },
                time: {
                    unit: 'hour',
                    displayFormats: {
                        'hour': 'MMM dd, hh a',
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
    let unit;

    // Will have either "regular-interval-values" or "irregular-interval-values"
    let intervalRegularity = "regular-interval-values";
    if (timeSeries[intervalRegularity] == undefined) intervalRegularity = "irregular-interval-values";

    if (intervalRegularity == "regular-interval-values") {
        // Spoiler: I don't know what it means if there are multiple segments 😬
        const segment = timeSeries[intervalRegularity].segments[0];
        const period = parsePeriod(timeSeries[intervalRegularity].interval);
        const comment = segment.comment.split(", ");
        const startTime = new Date(segment["first-time"]);
        const lastTime = new Date(segment["last-time"]);
        let values = segment.values;
        unit = timeSeries[intervalRegularity].unit;

        let checkTime = new Date(startTime);

        labels = [];
        for (let i = 0; i < segment["value-count"]; i++) {
            labels.push(checkTime);
            checkTime = checkTime.addPeriod(period);
        }
        MIN_MAX_TIME = [labels[0].addPeriod(period, -1), labels[labels.length - 1].addPeriod(period, 1)];

        values = values.map((dataPoint) => {
            return dataPoint[comment.indexOf("value")];
        });

        let obj = { label, data: values, hidden: false };
        datasets.push(obj);
    }


    else if (intervalRegularity == "irregular-interval-values") {
        const data = timeSeries[intervalRegularity];
        unit = data.unit;
        const comment = data.comment.split(", ");
        const dataPoints = data.values;

        let values = dataPoints.map(e => e[comment.indexOf("value")]);
        labels = dataPoints.map(e => new Date(e[comment.indexOf("time")]));

        let obj = { label, data: values, hidden: false };
        datasets.push(obj);
    }
    return { labels, datasets, unit };
}

/**
 * Parses ISO periods.
 * @param {String} periodStr A string in ISO format defining a period. Ex: "PT1H"
 * @returns An object with 
 */
function parsePeriod(periodStr) {
    let KEYS = ["YMWD", "HMS"];
    let DEFINITIONS = [["years", "months", "weeks", "days"], ["hours", "minutes", "seconds"]];
    let afterTime = 0;
    let parsed = {
        years: 0,
        months: 0,
        weeks: 0,
        days: 0,

        hours: 0,
        minutes: 0,
        seconds: 0,
    }
    let temp = "";
    for (let letter of periodStr) {
        if (letter == "P") continue;
        if (letter == "T") {
            afterTime = 1;
            continue;
        }
        if (KEYS[afterTime].indexOf(letter) == -1) {
            temp += letter;
        } else {
            parsed[DEFINITIONS[afterTime][KEYS[afterTime].indexOf(letter)]] = parseFloat(temp);
            temp = "";
        }
    }
    return parsed;
}

Date.prototype.addPeriod = function (period, scale = 1) {
    let newDate = new Date(this);
    newDate.setFullYear(newDate.getFullYear() + scale * period.years, newDate.getMonth() + scale * period.months, newDate.getDate() + scale * period.days + scale * period.weeks * 7);
    newDate.setHours(newDate.getHours() + scale * period.hours);
    newDate.setMinutes(newDate.getMinutes() + scale * period.minutes);
    newDate.setSeconds(newDate.getSeconds() + scale * period.seconds);
    return newDate;
}