/**
 * Constants
 */
const PUBLIC_NAME = "public-name";
const LONG_NAME = "long-name";
const CODE_NAME = "name";
const NEAREST_CITY = "nearest-city";

const SEARCH_RESULTS = "#searchResults";
const TIME_SERIES = "#timeSeries";

const NAME_SEARCH = "#nameSearch";
const CITY_SEARCH = "#citySearch";
const COUNTY_SEARCH = "#countySearch";

const LOADER = ".loader";
const COVER = ".cover";

let SELECTED_LOCATION;

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
 * @TODO: Split on space and find all matches
 */
function search() {
    let query = new RegExp($('#nameSearch').value, "i");
    let count = 0;
    $(SEARCH_RESULTS).innerHTML = "";
    $(TIME_SERIES).innerHTML = "";
    if ($(NAME_SEARCH).value=="" && $(CITY_SEARCH).value=="" && $(COUNTY_SEARCH).value=="") return;
    for (let letter of Object.getOwnPropertyNames(window["names"])) {
        for (let curr of window["names"][letter]) {
            if (matchName(curr, query) && matchCity(curr) && matchCounty(curr)) {
                count++;
                craftResult(curr);
                if (count >= 5) return;
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

function matchName(option, query) {
    let public = option[PUBLIC_NAME] && option[PUBLIC_NAME].match(query) != null;
    let long = option[LONG_NAME] && option[LONG_NAME].match(query) != null;
    let name = option[CODE_NAME] && option[CODE_NAME].match(query) != null;

    if (name == undefined) return false;

    return public || long || name;
}

function matchCity(option) {
    if ($(CITY_SEARCH).value == "") return true;
    if (!Object.getOwnPropertyNames(option).includes(NEAREST_CITY)) return false;
    let city = new RegExp($(CITY_SEARCH).value, "i");
    return option[NEAREST_CITY].match(city) != null;
}

function matchCounty(option) {
    if ($(COUNTY_SEARCH).value == "") return true;
    if (!Object.getOwnPropertyNames(option).includes("county")) return false;
    let county = new RegExp($(COUNTY_SEARCH).value, "i");
    return option["county"].match(county) != null;
}

/**
 * Crafts a summary card for the provided location's metadata.
 * The card includes various meta fields, a link to view the coordinates on Google Maps, and a button to find related TimeSeries.  
 * 
 * *This function can be overridden for different displayal with the same search.*
 * 
 * *This should really only be called by the {@link search()} function.*  
 * @param {JSON} metaData The metadata of a specific water location.
 * @private
 * @TODO: Lots of undefineds and some weird formatting
 */
function craftResult(metaData) {
    let result = document.createElement('div');
    result.innerHTML = `
        <p>${metaData[PUBLIC_NAME] || metaData["long-name"] || metaData["name"]}</p>
        <p>${metaData[NEAREST_CITY] || ""}</p>
        <p>${metaData["county"] && metaData["county"] != "Unknown County or County N/A" ? metaData["county"] + " County" : ""}</p>
        <hr>
    `;
    result.dataset.name = metaData["name"];
    result.dataset.office = metaData["office"];
    result.dataset.meta = JSON.stringify(metaData);
    result.classList.add("searchResult");
    result.onclick = autoFill;
    $(SEARCH_RESULTS).appendChild(result);
}

function autoFill() {
    let metaData = JSON.parse(this.dataset.meta);
    $(NAME_SEARCH).value = metaData[PUBLIC_NAME];
    $(SEARCH_RESULTS).innerHTML = "";
    SELECTED_LOCATION = metaData;
}

/**
 * This function queries the USACE API for any TimeSeries related to the water location.  
 * It will present the user with a list similar to the list created by {@link search()}.
 * ***This is only initiated by pressing on the `Find Timeseries!` button on a summary card!***
 * @param {HTMLElement} elem The element whose `Find Timeseries!` button was pressed.
 * @async
 */
async function findTimeSeries() {
    if (!SELECTED_LOCATION) return;
    toggleLoader();
    $(TIME_SERIES).innerHTML = "";
    // console.log(elem.dataset.name, elem.dataset.office);
    let office = SELECTED_LOCATION.office;
    let name = SELECTED_LOCATION.name;
    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/catalog/timeseries?office=${office}&like=${encodeURIComponent(name)}%5C.`);
    const res = await fetch(query);
    const json = await res.json();
    for (let timeSeries of json.entries) {
        craftTimeSeriesSelector(timeSeries);
    }
    if (json.entries.length == 0) {
        $(TIME_SERIES).innerHTML = "<h3>No Time Series Found :(</h3>";
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
 * @private
 */
function craftTimeSeriesSelector(metaData) {
    let result = document.createElement('div');
    result.innerHTML = `
        <h3>${metaData.name.split(".")[1]}</h3>
        <p>Measuring Interval: ${metaData.interval}</p>
        <p>Recording Unit: ${metaData.units}</p>
        <button onclick="graphTimeSeries(this.parentElement)">Graph Timeseries!</button>
    `;
    result.dataset.json = JSON.stringify(metaData);
    result.classList.add("result");
    $(TIME_SERIES).appendChild(result);
}

function toggleLoader() {
    if ($(LOADER)[0].style.display == "block") {
        $(COVER)[0].style.display = "none";
        $(LOADER)[0].style.display = "none";
    } else {
        $(COVER)[0].style.display = "block";
        $(LOADER)[0].style.display = "block";
    }
}