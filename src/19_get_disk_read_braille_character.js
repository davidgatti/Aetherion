let get_braille_character = require('./utility/get_braille_character.js');

//
//	Get braille character for disk READ I/O percentage
//
async function get_disk_read_braille_character_internal(disk_read_percentage) {

    //
    //	--> delegate to common braille character utility
    //
    return await get_braille_character(disk_read_percentage);
}

module.exports = get_disk_read_braille_character_internal;