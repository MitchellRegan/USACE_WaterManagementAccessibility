/**
* Called from create_event.html when the user types in the siteSearch input field.
* Fills the siteList datalist with valid water site options based on their input.
*/
function findSiteOptions(inputText){
    console.log("Looking for " + inputText);
    var siteResults = document.querySelectorAll(inputText);
    var list = document.getElementById('siteList');

    siteResults.forEach(function(item){
        var option = document.createElement('option');
        option.value = item;
        list.appendChild(option);
    });
}


/**
* Function called from create_event.html on form submission.
*/
async function writeDatabaseEvt(title, desc, startDate, endDate, timezone, img){
    const db = queryDB();
    console.log(db.HISTORICAL_EVENTS);
    
    let evtStart = (startDate.getTime() / 1000) + (3600 * timezone);
    let evtEnd = (endDate.getTime() / 1000) + (3600 * timezone);
    
    let evtjson = {
        "EVT_DESC":desc,
        "EVT_ENDDATE":evtEnd,
        "EVT_IMAGE":img,
        "EVT_STARTDATE":evtStart,
        "EVT_TITLE":title
    };
}