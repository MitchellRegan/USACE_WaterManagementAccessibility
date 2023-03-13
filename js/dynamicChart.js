fetchNameMeta();

async function fetchNameMeta() {
    let raw = await fetch('./json/meta.json');
    window["names"] = await raw.json();
    
    window["states"] = {};
}

function $(query) {
    if (query.includes("#")) return document.querySelector(query);
    return document.querySelectorAll(query);
}

function search() {
    // TODO: Ignore special chars .,...
    let query = new RegExp($('#search').value, "i");
    let count = 0;
    $("#results").innerHTML = "";
    for (let letter of Object.getOwnPropertyNames(window["names"])) {
        for (let curr of window["names"][letter]) {
            if ((curr["public-name"] && curr["public-name"].match(query) != null)
                || (curr["long-name"] && curr["long-name"].match(query) != null)
                || (curr["description"] && curr["description"].match(query) != null)
                || (curr["map-label"] && curr["map-label"].match(query) != null
                || (curr["name"] && curr["name"].match(query) != null))
            ) {
                count++;
                craftResult(curr);
                if (count > ($("#numResults").value || 20)) return;
            }
            if (curr["state"] != undefined) {
                let state = curr["state"];
                if (window["states"][state] == undefined) window["states"][state] = [];
                window["states"][state].push(curr);
            }
        }
    }
}

function craftResult(metaData) {
    // console.log(metaData);
    let result = document.createElement('div');
    // TODO: Lots of undefineds and some weird formatting
    result.innerHTML = `
        <h3>${metaData["public-name"] || metaData["long-name"]}</h3>
        <p>${metaData["nearest-city"] || ""}</p>
        <p>${metaData["county"] || ""} County</p>
        <p>${metaData["description"] || ""}</p>
        <p>${metaData["map-label"] || ""}</p>
        <p>${metaData["name"] || ""}</p>
        <a target="blank" href="https://www.google.com/maps/search/?api=1&query=${metaData["latitude"]},${metaData["longitude"]}">View on Map</a>
        <button onclick="findTimeSeries(this.parentElement)">Find Timeseries!</button>
    `;
    result.dataset.name = metaData["name"];
    result.dataset.office = metaData["office"];
    result.classList.add("result");
    $("#results").appendChild(result);
}

async function findTimeSeries(elem) {
    // TODO: Visualize picker / fetch them all?
    console.log(elem.dataset.name, elem.dataset.office);
    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/catalog/timeseries?office=${elem.dataset.office}&like=${elem.dataset.name}%5C.`);
    const res = await fetch(query);
    const json = await res.json();
    console.log(json);
}

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

Date.prototype.addHours = function(hours) {
    var date = new Date(this.valueOf());
    date.setHours(date.getHours() + hours);
    return date;
}