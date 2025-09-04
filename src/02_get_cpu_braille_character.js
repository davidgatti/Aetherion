let get_braille_character = require('./utility/get_braille_character.js');

//
//Convert CPU usage percentage to braille character
//
async function get_cpu_braille_character(cpu_usage_percent) {

    //
    //  --> delegate to common braille character utility
    //
    return await get_braille_character(cpu_usage_percent);
}

module.exports = get_cpu_braille_character;
