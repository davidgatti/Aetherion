let get_cpu_braille_character = require('./02_get_cpu_braille_character.js');

//
//	Get braille character for network OUT traffic percentage
//
//	Uses the same braille progression as CPU cores for consistency:
//	0-10%: ⣀ (minimal activity)
//	10-20%: ⣄ (low activity)
//	20-40%: ⣤ (moderate activity)
//	40-60%: ⣶ (high activity)
//	60-80%: ⣷ (very high activity)
//	80-100%: ⣿ (maximum activity)
//
async function get_network_out_braille_character_internal(network_out_percentage) {

    //
    //	Validate input parameter
    //
    if (typeof network_out_percentage !== 'number') {

        //
        //	^^^ network_out_percentage must be a number
        //
        throw new Error('network-out-percentage-must-be-number');
    }

    //
    //	Ensure percentage is within valid range
    //
    if (network_out_percentage < 0 || network_out_percentage > 100) {

        //
        //	^^^ network_out_percentage must be between 0 and 100
        //
        throw new Error('network-out-percentage-out-of-range');
    }

    //
    //	Use the same braille mapping as CPU cores for consistency
    //
    return await get_cpu_braille_character(network_out_percentage);
}

module.exports = get_network_out_braille_character_internal;
