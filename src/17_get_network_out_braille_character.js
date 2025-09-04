let get_braille_character = require('./utility/get_braille_character.js');

//
//	Get braille character for network OUT traffic percentage
//
async function get_network_out_braille_character_internal(network_out_percentage) {

    //
    //	--> delegate to common braille character utility
    //
    return await get_braille_character(network_out_percentage);
}

module.exports = get_network_out_braille_character_internal;
