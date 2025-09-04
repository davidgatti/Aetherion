//
//Convert RAM usage percentage to braille character using 8-level progression
//
let get_braille_character = require('./utility/get_braille_character.js');

async function get_ram_braille_character(ram_usage_percent) {

    //
    //	--> delegate to common braille character utility
    //
    return await get_braille_character(ram_usage_percent);
}

module.exports = get_ram_braille_character;
