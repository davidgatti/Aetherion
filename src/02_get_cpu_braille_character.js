//
//Convert CPU usage percentage to braille character
//
async function get_cpu_braille_character(cpu_usage_percent) {

//
//Validate input parameter
//
if (typeof cpu_usage_percent !== 'number') {

//
//^^^ invalid usage percentage provided
//
throw new Error('cpu-usage-must-be-number');
}

//
//Map usage percentage to braille character
//
if (cpu_usage_percent < 10) {

//
//--> return empty braille for very low usage
//
return '⣀';
}

if (cpu_usage_percent < 20) {

//
//--> return bottom dots for low usage
//
return '⣄';
}

if (cpu_usage_percent < 40) {

//
//--> return bottom half filled for moderate usage
//
return '⣤';
}

if (cpu_usage_percent < 60) {

//
//--> return most filled for high usage
//
return '⣶';
}

if (cpu_usage_percent < 80) {

//
//--> return almost complete for very high usage
//
return '⣷';
}

//
//--> return full braille block for maximum usage
//
return '⣿';
}

module.exports = get_cpu_braille_character;
