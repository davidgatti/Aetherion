//
//	Convert disk usage percentage to braille character
//
async function get_disk_braille_character(disk_usage_percent) {

    //
    //	Validate input parameter
    //
    if (typeof disk_usage_percent !== 'number') {

        //
        //	^^^ invalid usage percentage provided
        //
        throw new Error('disk-usage-must-be-number');
    }

    //
    //	Map usage percentage to braille character (same pattern as RAM)
    //
    if (disk_usage_percent < 10) {

        //
        //	--> return empty braille for very low usage
        //
        return '⣀';
    }

    if (disk_usage_percent < 20) {

        //
        //	--> return bottom dots for low usage
        //
        return '⣄';
    }

    if (disk_usage_percent < 40) {

        //
        //	--> return bottom half filled for moderate usage
        //
        return '⣤';
    }

    if (disk_usage_percent < 60) {

        //
        //	--> return most filled for high usage
        //
        return '⣶';
    }

    if (disk_usage_percent < 80) {

        //
        //	--> return almost complete for very high usage
        //
        return '⣷';
    }

    //
    //	--> return full braille block for maximum usage
    //
    return '⣿';
}

module.exports = get_disk_braille_character;
