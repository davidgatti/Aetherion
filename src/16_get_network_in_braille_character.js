let get_braille_character = require('./utility/get_braille_character.js');

//
//	Get braille character for network IN traffic percentage
//
async function get_network_in_braille_character_internal(network_in_percentage) {

    //
    //	--> delegate to common braille character utility
    //
    return await get_braille_character(network_in_percentage);
}

module.exports = get_network_in_braille_character_internal;
