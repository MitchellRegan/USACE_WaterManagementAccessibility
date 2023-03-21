/** File Information
 * This file is for **generating** the `meta.json` file.  
 * It is not perfect, it gets 504 errors often, but I think that is on the API mostly. It eventually works with more attempts.  
 * 
 * TODO: Make total check dynamic (get all water locations and check `total` attribute)
 * TODO: This is *already* out of date, but is a good proof-of-concept
 */

/***/
const fs = require("fs");

let total = 0;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let dict = {};
for (let letter of alphabet) {
    const query = new Request(`https://cwms-data.usace.army.mil/cwms-data/catalog/locations?like=%5E${letter}&page-size=5000`);
    fetch(query)
        .then((res) => res.json())
        .then((json) => {
            total += json.total;
            console.log(letter, "\t", json.total, "\t", total);
            dict[letter] = json.entries;
            if (total == 41665) infoDump();
        });
}

function infoDump() {
    fs.writeFileSync("../json/meta.json", JSON.stringify(dict));
}