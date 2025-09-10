let get_braille_character = require('./utility/get_braille_character.js');

//
//	Get braille character for disk WRITE I/O percentage
//
async function get_disk_write_braille_character_internal(disk_write_percentage) {

    //
    //	--> delegate to common braille character utility
    //
    return await get_braille_character(disk_write_percentage);
}

module.exports = get_disk_write_braille_character_internal;