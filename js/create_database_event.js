async function queryDB() {
    const dBQuery = new Request("https://mregan-capstone-default-rtdb.firebaseio.com/HISTORICAL_EVENTS/.json/?");
    let dB = await fetch(dBQuery);
    dB = await dB.json();
    return dB;
}


function toEpochTime(edate, timezone){
    console.log(edate, timezone)
    let d = new Date();
    d.toUTCString()
}


async function writeDatabaseEvt(title, desc, startDate, endDate, timezone, img){
    //const db = queryDB();
    //console.log(db);
    
    let evtStart = toEpochTime(startDate, timezone);
}