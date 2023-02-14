// https://help.waterdata.usgs.gov/faq/automated-retrievals#Examples

const granularity = 10;

const query = new Request("https://waterservices.usgs.gov/nwis/iv/?sites=02098197&period=P7D&format=json");
let res;
fetch(query)
    .then((response) => response.json())
    .then((json) => {
        const ctx = document.getElementById('myChart');
        let datasets = [];
        let labels;
        for (let i in json.value.timeSeries) {
            let cur = json.value.timeSeries[i];
            let label = cur.variable.variableName;
            let dataPoints = cur.values[0].value;
            
            labels = dataPoints.map((dataPoint) => {
                return dataPoint.dateTime;
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
            
            let obj = {label, data:scrunched, hidden:true};
            console.log(obj);
            datasets.push(obj);
        }
        datasets[1].hidden = false;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
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
                    }
                }
            }
        });
    });


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