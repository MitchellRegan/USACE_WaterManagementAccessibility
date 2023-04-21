let idToken = undefined;

/*
Firebase code for initializing the OAuth login.
Reference: https://github.com/firebase/firebaseui-web
*/
function initApp() {
    const firebaseConfig = {
        apiKey: "AIzaSyAr7SQASmasb7pk7E3OHhuewJoY76CcJ30",
        authDomain: "mregan-capstone.firebaseapp.com",
        databaseURL: "https://mregan-capstone-default-rtdb.firebaseio.com",
        projectId: "mregan-capstone",
        storageBucket: "mregan-capstone.appspot.com",
        messagingSenderId: "736102415357",
        appId: "1:736102415357:web:06211517f034486cc37794"
    };
    const app = firebase.initializeApp(firebaseConfig);
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in.
            var email = user.email;
            user.getIdToken()
                .then(t => { idToken = t; })
            
            document.getElementById("email").value = user.email;
            document.getElementById('signedIn').style.display = 'visible';
            document.getElementById('signedOut').style.display = 'none';
            //Only allowing USACE members to access this page
            if (email.split('@')[0] == 'usace.army.mil') {
                document.getElementById('invalidUser').style.display = 'visible';
            }
        } else {
            // User is signed out.
            document.getElementById('signedIn').style.display = 'none';
            document.getElementById('signedOut').style.display = 'visible';
            document.getElementById('invalidUser').style.display = 'none';
        }
    }, function (error) {
        console.error(error);
    });
};


//Loading the Firebase OAuth code when the page loads
window.addEventListener('load', function () {
    initApp()
});


/*
Firebase code for logging the user out.
Reference: https://github.com/firebase/firebaseui-web
*/
function logUserOut () {
    firebase.auth().signOut().then(() => {
        token = undefined;
        console.info("signing out...");
        window.location.href = './usace_login.html';
    });
};


/**
* Called from create_event.html when the user types in the siteSearch input field.
* Fills the siteList datalist with valid water site options based on their input.
*/
function addSiteToList(){
    //Check if the site is valid
    if(SELECTED_LOCATION == undefined){
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
    liElement.dataset.meta = JSON.stringify(SELECTED_LOCATION);
    
    let siteDiv = document.createElement("div");
    liElement.appendChild(siteDiv);
    
    let nameText = document.createTextNode(SELECTED_LOCATION["public-name"] || SELECTED_LOCATION["name"] + "\t\t");
    let xButton = document.createElement("button");
    let xText = document.createTextNode("X");
    xButton.type = "button";
    xButton.addEventListener('click', function(){liElement.remove();});
    siteDiv.appendChild(nameText);
    siteDiv.appendChild(xButton);
    xButton.appendChild(xText);
    
    //Parenting the new location name to the "addedSites" unordered list
    p.appendChild(liElement);

    SELECTED_LOCATION = undefined;
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
    if(!(/^[a-zA-Z0-9_\-\s]*$/.test(title))){
        alert("The title can only contain letters, numbers, spaces, hyphens, and underscores.")
        return false;
    }
    
    if(desc == ''){
        alert("Please provide a description for the event.");
        return false;
    }
    if(!(/^[a-zA-Z0-9_.\-\s]*$/.test(desc))){
        alert("The description can only contain letters, numbers, periods, spaces, hyphens, and underscores.")
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
    if(idToken === undefined){
        alert("You do not appear to be logged in. That's odd...");
        return;
    }
    
    //Getting the list of water sites
    let sites = [];
    for(var i = 0; i < document.getElementById('addedSites').children.length; i++){
        let metaData = document.getElementById('addedSites').children[i].dataset.meta;
        metaData = JSON.parse(metaData);
        sites.push(metaData["name"]);
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
    
    fetch('https://mregan-capstone-default-rtdb.firebaseio.com/HISTORICAL_EVENTS.json?auth='+idToken, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + idToken
        },
        body: JSON.stringify({
            "EMAIL":email,
            "EVT_TITLE":title,
            "EVT_DESC":desc,
            "EVT_ENDDATE":evtEnd,
            "EVT_IMAGE":img,
            "EVT_STARTDATE":evtStart,
            "EVT_SITES": sites
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.hasOwnProperty('error')){
            alert("An error occurred. Event not uploaded to database. Cause: " + data.error);
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