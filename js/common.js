/**
 * A shortened and more convenient version of document.querySelectorAll() and document.querySelector()
 * @param {String} query A CSS Selector
 * @returns An array of elements or a single element
 */
function $(query) {
    if (query.includes("#")) return document.querySelector(query);
    return document.querySelectorAll(query);
}

/**
 * Fetch the `meta.json` file from the site host.  
 * Adds the result to a window namespaced variable: `window.names`.
 * 
 * *This function is automatically called on js load.*
 * @async
 */
async function fetchNameMeta() {
    let raw = await fetch('./json/meta.json');
    window["names"] = await raw.json();
}
fetchNameMeta();

/**
 * Searches through the JSON data stored in the window namespace variable for a given search term.  
 * Several (but not all) JSON attributes are searched for string matches.  
 * 
 * Also sorts the data (by state) into a window namespaced variable: `window.states`.
 * @TODO: Ignore special chars [. , etc.]
 */
function search(id = "#results") {
    let query = new RegExp($('#search').value, "i");
    let count = 0;
    $(id).innerHTML = "";
    for (let letter of Object.getOwnPropertyNames(window["names"])) {
        for (let curr of window["names"][letter]) {
            if ((curr["public-name"] && curr["public-name"].match(query) != null)
                || (curr["long-name"] && curr["long-name"].match(query) != null)
                || (curr["description"] && curr["description"].match(query) != null)
                || (curr["map-label"] && curr["map-label"].match(query) != null
                    || (curr["name"] && curr["name"].match(query) != null))
            ) {
                count++;
                craftResult(curr, id);
                if (count > ($("#numResults").value || 20)) return;
            }
            if (curr["state"] != undefined) {
                let state = curr["state"];
                if (window["states"] == undefined) window["states"] = {};
                if (window["states"][state] == undefined) window["states"][state] = [];
                window["states"][state].push(curr);
            }
        }
    }
}

/**
 * Crafts a summary card for the provided location's metadata.
 * The card includes various meta fields, a link to view the coordinates on Google Maps, and a button to find related TimeSeries.  
 * 
 * *This function can be overridden for different displayal with the same search.*
 * 
 * *This should really only be called by the {@link search()} function.*  
 * @param {JSON} metaData The metadata of a specific water location.
 * @param {String} id A CSS ID indicating where the results should be added.
 * @private
 * @TODO: Lots of undefineds and some weird formatting
 */
function craftResult(metaData, id) {
    // console.log(metaData);
    let result = document.createElement('div');
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
    $(id).appendChild(result);
}

/**
 * This function queries the USACE API for any TimeSeries related to the water location.  
 * It will present the user with a list similar to the list created by {@link search()}.
 * ***This is only initiated by pressing on the `Find Timeseries!` button on a summary card!***
 * @param {HTMLElement} elem The element whose `Find Timeseries!` button was pressed.
 * @param {String} id A CSS ID indicating where the selectors should be added.
 * @async
 */
async function findTimeSeries(elem, id = "#timeSeries") {
    toggleLoader();
    $(id).innerHTML = "";
    console.log(elem.dataset.name, elem.dataset.office);
    let office = elem.dataset.office;
    let name = elem.dataset.name;
    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/catalog/timeseries?office=${office}&like=${encodeURIComponent(name)}%5C.`);
    const res = await fetch(query);
    const json = await res.json();
    for (let timeSeries of json.entries) {
        craftTimeSeriesSelector(timeSeries, id);
    }
    if (json.entries.length == 0) {
        $(id).innerHTML = "<h3>No Time Series Found :(</h3>";
    }
    toggleLoader();
}

/**
 * Crafts a selection option for the provided timeseries.  
 * 
 * *This function can be overridden for different displayal.*
 * 
 * *This should really only be called by the {@link findTimeSeries()} function.*  
 * @param {JSON} metaData The metadata of a specific timeseries.
 * @param {String} id A CSS ID indicating where the selectors should be added.
 * @private
 */
function craftTimeSeriesSelector(metaData, id) {
    let result = document.createElement('div');
    result.innerHTML = `
        <h3>${metaData.name}</h3>
        <p>Measuring Interval: ${metaData.interval}</p>
        <p>Recording Unit: ${metaData.units}</p>
        <button onclick="graphTimeSeries(this.parentElement)">Graph Timeseries!</button>
    `;
    result.dataset.json = JSON.stringify(metaData);
    result.classList.add("result");
    $(id).appendChild(result);
}

function toggleLoader() {
    if ($(".loader")[0].style.display == "block") {
        $(".cover")[0].style.display = "none";
        $(".loader")[0].style.display = "none";
    } else {
        $(".cover")[0].style.display = "block";
        $(".loader")[0].style.display = "block";
    }
}