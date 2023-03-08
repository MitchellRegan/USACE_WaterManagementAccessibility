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