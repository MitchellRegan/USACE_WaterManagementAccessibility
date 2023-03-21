/**
 * TODO: yeah
 */
async function graphTimeSeries(elem) {
    let meta = JSON.parse(elem.dataset.json);
    console.log(meta);
    let office = meta.office;
    let name = meta.name;
    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/timeseries?office=${office}&name=${encodeURIComponent(name)}&begin=PT-${$("#numResults").value || 24}h`);
    const res = await fetch(query);
    const data = await res.json();
    console.log(data);
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

// Date.prototype.addHours = function(hours) {
//     var date = new Date(this.valueOf());
//     date.setHours(date.getHours() + hours);
//     return date;
// }