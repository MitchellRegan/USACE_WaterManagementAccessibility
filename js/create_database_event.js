/**
* Called from create_event.html when the user types in the siteSearch input field.
* Fills the siteList datalist with valid water site options based on their input.
*/
function addSiteToList(){
    //Get the site name from the input field
    let name = document.getElementById("nameSearch").value;
    
    //Check if the site is valid
    if(name == ''){
        document.getElementById("invalidSiteName").style.display = "block";
        return;
    }
    else{
        document.getElementById("invalidSiteName").style.display = "none";
        document.getElementById("nameSearch").value = "";
    }
    
    //Finding the number of elements already in the "addedSites" list
    let p = document.getElementById("addedSites");
    
    //Creating a text element to display the newly added location name
    let liElement = document.createElement("li");
    
    let siteDiv = document.createElement("div");
    liElement.appendChild(siteDiv);
    
    let nameText = document.createTextNode(name + "\t\t");
    let xButton = document.createElement("button");
    let xText = document.createTextNode("X");
    xButton.onclick = removeSiteFromList;
    xButton.type = "button";
    siteDiv.appendChild(nameText);
    siteDiv.appendChild(xButton);
    xButton.appendChild(xText);
    
    //Parenting the new location name to the "addedSites" unordered list
    p.appendChild(liElement);
}


function removeSiteFromList(index){
    console.log("Removing " + index.pointerId);
}


/**
* Function to check for any potential errors or malicious code injection with the user-given inputs.
* Returns True if all checks are valid.
*/
function validateData(email, title, desc, sDate, eDate, img, sites){
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
    if(sDate == '' || eDate == ''){
        alert("Please provide a starting date and ending date for when this event occurred.");
        return false;
    }
    if(sites.length == 0){
        alert("Please enter at least one water site that was affected by this historical event.");
        return false;
    }
    
    //Preventing JSON injection
    var combinedStr = "" + title + desc + sDate + eDate + img;
    for(var i = 0; i < sites.length; i++){
        combinedStr += sites[i];
    }
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
    document.getElementById('evtStart').value = '';
    document.getElementById('evtEnd').value = '';
    document.getElementById('evtTZ').value = '';
    document.getElementById('evtImg').value = '';
    
    while(document.getElementById('addedSites').children.length > 0){
        document.getElementById('addedSites').children[0].remove();
    }
}


/**
* Function called from create_event.html on form submission.
*/
async function writeDatabaseEvt(email, title, desc, startDate, endDate, timezone, img){
    //Getting the list of water sites
    let sites = [];
    for(var i = 0; i < document.getElementById('addedSites').children.length; i++){
        let cText = document.getElementById('addedSites').children[i].textContent;
        cText = cText.split('\t')[0];
        sites.push(cText);
    }
    
    //Validating the inputs first
    if(!validateData(email, title, desc, startDate, endDate, img, sites)){
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
        "EVT_SITES": sites
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