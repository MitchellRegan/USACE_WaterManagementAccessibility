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