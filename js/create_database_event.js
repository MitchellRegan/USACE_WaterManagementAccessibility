/**
* Called from create_event.html when the user types in the siteSearch input field.
* Fills the siteList datalist with valid water site options based on their input.
*/
function findSiteOptions(inputText){
    console.log("Looking for " + inputText);
    var siteResults = document.querySelectorAll(inputText);
    console.log("Results:" + siteResults.length);
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
async function writeDatabaseEvt(title, desc, sites, startDate, endDate, timezone, img){
    if(title == '' || desc == '' || sites == '' || startDate == '' || endDate == ''){
        alert("Please fill out all required fields.");
        return;
    }
    
    let sd = new Date(startDate);
    let ed = new Date(endDate);
    let evtStart = (sd.getTime() / 1000) + (3600 * timezone);
    let evtEnd = (ed.getTime() / 1000) + (3600 * timezone);
    if(evtStart > evtEnd){
        let placeholder = evtStart;
        evtStart = evtEnd;
        evtEnd = placeholder;
    }
    
    let evtjson = {
        "EVT_TITLE":title,
        "EVT_DESC":desc,
        "EVT_ENDDATE":evtEnd,
        "EVT_IMAGE":img,
        "EVT_STARTDATE":evtStart,
    };
    
    console.log(evtjson);
    
    fetch('https://mregan-capstone-default-rtdb.firebaseio.com/HISTORICAL_EVENTS.json', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(evtjson)
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(e => {
        console.error(e);
        alert("An error occurred. Event not uploaded to database.");
    })
}


function testWriteDb(token){
    console.log("===\n" + token + "\n---");
    fetch('https://mregan-capstone-default-rtdb.firebaseio.com/HISTORICAL_EVENTS.json', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'auth': token
        },
        body: JSON.stringify({
            "EVT_DESC":"Test description",
            "EVT_ENDDATE":"Test end",
            "EVT_IMAGE":undefined,
            "EVT_STARTDATE":"Test start",
            "EVT_TITLE":"Test Title"
        })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(e => {
        console.error(e);
        alert("An error occurred. Event not uploaded to database.");
    })
    
    /**import {getDatabase, ref, push, child, update} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
    const tdb = getDatabase();
    push(ref(tdb, "HISTORICAL_EVENTS/"),{
        "EVT_DESC":"Test description",
        "EVT_ENDDATE":"Test end",
        "EVT_IMAGE":undefined,
        "EVT_STARTDATE":"Test start",
        "EVT_TITLE":"Test Title"
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(e => console.error(e))*/
}