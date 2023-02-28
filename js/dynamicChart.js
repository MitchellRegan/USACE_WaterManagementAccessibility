getTimeSeries($('#search').value, $('#office').value, $('#hours').value)

function $(query) {
    if (query.includes("#")) return document.querySelector(query);
    return document.querySelectorAll(query);
}

function search(keywrd) {
    let request = new Request(`https://cwms-data.usace.army.mil/cwms-data/catalog/LOCATIONS?like=${keywrd}`);
    fetch(request).then((res) => res.json()).then((json) => {
        console.log(json);
    });
}

function getTimeSeries(name, office="", hours=24) {
    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/timeseries?office=${office}&name=${name}.Elev.Inst.1Hour.0.Decodes-Rev&begin=PT-${hours}h`);
    fetch(query).then((response) => response.json())
    .then((json) => {
        let timeSeries = json["time-series"]["time-series"][0]["regular-interval-values"]["segments"][0]["values"];

        let firstTime = json["time-series"]["time-series"][0]["regular-interval-values"]["segments"][0]["first-time"];
        let lastTime = json["time-series"]["time-series"][0]["regular-interval-values"]["segments"][0]["last-time"];
        firstTime = new Date(firstTime);
        lastTime = new Date(lastTime);
        let checkTime = firstTime.addHours(0);

        let labels = [];
        while ((checkTime = checkTime.addHours(1)) < lastTime) {
            labels.push(checkTime.toLocaleString());
        }

        timeSeries = timeSeries.map((dataPoint) => {
            return dataPoint[0];
        });

        let label = "Instantaneous Elevation";
        let obj = {label, data:timeSeries, hidden:false};
        console.table(timeSeries);
        console.log(json);
        graph(labels, [obj]);
    });
}

function graph(labels, timeSeries) {
    const ctx = document.getElementById('myChart');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: timeSeries
        },
        options: {
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
                    enabled: true,
                    threshold: 1,
                },
            }
        }
    });
}

function toggleLegendClickHandler (e, legendItem, legend) {
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

Date.prototype.addHours = function(hours) {
    var date = new Date(this.valueOf());
    date.setHours(date.getHours() + hours);
    return date;
}