let os = require('os');
let get_braille_character = require('./utility/get_braille_character.js');

//
//	Store previous CPU times for usage calculation
//
let previous_cpu_times = [];

//
//	Calculate CPU usage percentage for each core
//
async function calculate_cpu_usage() {

    //
    //	Get current CPU times
    //
    let current_cpu_times = os.cpus();
    let usage_percentages = [];

    //
    //	First run check - store current times and return zero usage
    //
    if (previous_cpu_times.length === 0) {

        //
        //	Store current times for next calculation
        //
        previous_cpu_times = current_cpu_times;

        //
        //	--> return zeros for first run
        //
        return current_cpu_times.map(() => 0);
    }

    //
    //	Calculate usage for each CPU core
    //
    for (let i = 0; i < current_cpu_times.length; i++) {

        //
        //	Get current and previous times
        //
        let current = current_cpu_times[i].times;
        let previous = previous_cpu_times[i].times;

        //
        //	Calculate time differences
        //
        let idle_difference = current.idle - previous.idle;
        let total_difference = Object.values(current).reduce((a, b) => a + b, 0) -
		                      Object.values(previous).reduce((a, b) => a + b, 0);

        //
        //	Calculate usage percentage (avoid division by zero)
        //
        let usage_percent = total_difference > 0 ?
		                   ((total_difference - idle_difference) / total_difference) * 100 : 0;

        //
        //	Store usage percentage
        //
        usage_percentages.push(Math.max(0, Math.min(100, usage_percent)));
    }

    //
    //	Store current times for next calculation
    //
    previous_cpu_times = current_cpu_times;

    //
    //	--> return calculated usage percentages
    //
    return usage_percentages;
}

//
//	Convert CPU usage percentage to braille character
//
async function get_cpu_braille_character(cpu_usage_percent) {

    //
    //  --> delegate to common braille character utility
    //
    return await get_braille_character(cpu_usage_percent);
}

module.exports = {
    calculate_cpu_usage,
    get_cpu_braille_character
};
