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
* Function to check for any potential errors or malicious code injection with the user-given inputs.
* Returns True if all checks are valid.
*/
function validateData(email, title, desc, sites, sDate, eDate, img){
    //Checking for empty input fields for required data
    if(email == ''){
        alert("You do not appear to be signed in.");
        return false;
    }
    if(title == ''){
        alert("Please provide a title for this event.");
        return false;
    }
    if(desc == ''){
        alert("Please provide a description for the event.");
        return false;
    }
    if(sites == ''){
        alert("Please provide at least one water site that was affected by this event.");
        return false;
    }
    if(sDate == '' || eDate == ''){
        alert("Please provide a starting date and ending date for when this event occurred.");
        return false;
    }
    
    //Preventing JSON injection
    var combinedStr = "" + title + desc + sites + sDate + eDate + img;
    if(combinedStr.includes('{') || combinedStr.includes('}')){
        alert("The characters '{' and '}' are not allowed.");
        return false;
    }
    
    //If all checks have been passed, we're safe to upload to the database
    return true;
}


/**
* Function to clear all of the input fields on create_database_event.html after a successful upload.
*/
function clearInputFields(){
    document.getElementById('evtTitle').value = '';
    document.getElementById('evtDesc').value = '';
    document.getElementById('siteSearch').value = '';
    document.getElementById('evtStart').value = '';
    document.getElementById('evtEnd').value = '';
    document.getElementById('evtTZ').value = '';
    document.getElementById('evtImg').value = '';
}


/**
* Function called from create_event.html on form submission.
*/
async function writeDatabaseEvt(email, title, desc, sites, startDate, endDate, timezone, img){
    //Validating the inputs first
    if(!validateData(email, title, desc, sites, startDate, endDate, img)){
        return;
    }
    
    //Converting the start and end dates to Epoch time in seconds
    let sd = new Date(startDate);
    let ed = new Date(endDate);
    let evtStart = (sd.getTime() / 1000) + (3600 * timezone);
    let evtEnd = (ed.getTime() / 1000) + (3600 * timezone);
    //Making sure the end date actually comes after the start date
    if(evtStart > evtEnd){
        let placeholder = evtStart;
        evtStart = evtEnd;
        evtEnd = placeholder;
    }
    //Making sure neither of the dates are in the future
    let now = new Date();
    if(evtEnd > (now.getTime() / 1000)){
        alert("The time stamps for this event cannot be in the future.");
        return;
    }
    
    let evtjson = {
        "EMAIL":email,
        "EVT_TITLE":title,
        "EVT_DESC":desc,
        "EVT_ENDDATE":evtEnd,
        "EVT_IMAGE":img,
        "EVT_STARTDATE":evtStart,
    };
    
    fetch('https://mregan-capstone-default-rtdb.firebaseio.com/HISTORICAL_EVENTS.json', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(evtjson)
    })
    .then(response => response.json())
    .then(data => {
        if(data.hasOwnProperty('error')){
            alert(data.error);
        }
        else{
            clearInputFields();
            alert("Event " + title + " has been created and uploaded to the database.");
        }
    })
    .catch(e => {
        console.error(e);
        alert("An error occurred. Event not uploaded to database.");
    })
}