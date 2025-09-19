//
//  Get braille character for any percentage value
//
//  8-level braille progression for system monitoring:
//  0-12.5%: ⠄ (minimal activity)
//  12.5-25%: ⠤ (low activity)
//  25-37.5%: ⠦ (low-moderate activity)
//  37.5-50%: ⠶ (moderate activity)
//  50-62.5%: ⠷ (moderate-high activity)
//  62.5-75%: ⠿ (high activity)
//  75-87.5%: ⣷ (very high activity)
//  87.5-100%: ⣿ (maximum activity)
//
async function get_braille_character(percentage) {

    //
    //  Validate input parameter
    //
    if (typeof percentage !== 'number') {

        //
        //  ^^^ percentage must be a number
        //
        throw new Error('percentage-must-be-number');
    }

    //
    //  Ensure percentage is within valid range
    //
    if (percentage < 0 || percentage > 100) {

        //
        //  ^^^ percentage must be between 0 and 100
        //
        throw new Error('percentage-out-of-range');
    }

    //
    //  Map usage percentage to 8-level braille character progression
    //
    if (percentage < 12.5) {

        //
        //  --> return minimal dots for very low usage (0-12.5%)
        //
        return '⡀';
    }

    if (percentage < 25) {

        //
        //  --> return low fill for low usage (12.5-25%)
        //
        return '⣀';
    }

    if (percentage < 37.5) {

        //
        //  --> return low-moderate fill for low-moderate usage (25-37.5%)
        //
        return '⣠';
    }

    if (percentage < 50) {

        //
        //  --> return moderate fill for moderate usage (37.5-50%)
        //
        return '⣤';
    }

    if (percentage < 62.5) {

        //
        //  --> return moderate-high fill for moderate-high usage (50-62.5%)
        //
        return '⣦';
    }

    if (percentage < 75) {

        //
        //  --> return high fill for high usage (62.5-75%)
        //
        return '⣶';
    }

    if (percentage < 87.5) {

        //
        //  --> return very high fill for very high usage (75-87.5%)
        //
        return '⣾';
    }

    //
    //  --> return full braille block for maximum usage (87.5-100%)
    //
    return '⣿';
}

module.exports = get_braille_character;
