import * as os from 'os';

//
//	Store previous CPU times for usage calculation
//
let previous_cpu_times: os.CpuInfo[] = [];

//
//	Calculate CPU usage percentage for each core
//
export default async function(): Promise<number[]> {
	
	//
	//	Get current CPU times
	//
	let current_cpu_times = os.cpus();
	let usage_percentages: number[] = [];

	//
	//	First run check - store current times and return zero usage
	//
	if (previous_cpu_times.length === 0) {
		
		//
		//	--> skip calculation on first run
		//
		previous_cpu_times = current_cpu_times;
		return new Array(current_cpu_times.length).fill(0);
	}

	//
	//	Calculate usage for each CPU core
	//
	for (let core_index = 0; core_index < current_cpu_times.length; core_index++) {
		
		let current_core_times = current_cpu_times[core_index].times;
		let previous_core_times = previous_cpu_times[core_index].times;

		//
		//	Calculate total time differences
		//
		let current_total_time = Object.values(current_core_times).reduce(function(accumulator: number, time_value: number) {
			return accumulator + time_value;
		}, 0);
		
		let previous_total_time = Object.values(previous_core_times).reduce(function(accumulator: number, time_value: number) {
			return accumulator + time_value;
		}, 0);

		//
		//	Calculate idle time differences
		//
		let current_idle_time = current_core_times.idle;
		let previous_idle_time = previous_core_times.idle;

		let total_time_difference = current_total_time - previous_total_time;
		let idle_time_difference = current_idle_time - previous_idle_time;

		//
		//	Calculate usage percentage
		//
		let cpu_usage_percent = 0;
		
		if (total_time_difference !== 0) {
			cpu_usage_percent = 100 - (idle_time_difference / total_time_difference) * 100;
			cpu_usage_percent = Math.max(0, Math.min(100, cpu_usage_percent));
		}

		usage_percentages.push(cpu_usage_percent);
	}

	//
	//	Update previous times for next calculation
	//
	previous_cpu_times = current_cpu_times;

	//
	//	--> return calculated usage percentages
	//
	return usage_percentages;
};
