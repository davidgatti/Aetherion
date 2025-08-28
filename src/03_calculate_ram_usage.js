let os = require('os');

//
//	Calculate RAM usage percentage and memory information
//
async function calculate_ram_usage_internal() {
	
	//
	//	Get system memory information
	//
	let total_memory_bytes = os.totalmem();
	let free_memory_bytes = os.freemem();
	let total_memory_gb = total_memory_bytes / (1024 * 1024 * 1024);
	let free_memory_gb = free_memory_bytes / (1024 * 1024 * 1024);
	
	//
	//	Get operating system platform
	//
	let operating_system_platform = os.platform();
	let usage_percent = 0;
	let available_memory_gb = 0;

	//
	//	Platform-specific memory calculation
	//
	if (operating_system_platform === 'darwin') {
		
		//
		//	macOS: free memory is available memory
		//
		available_memory_gb = free_memory_gb;
		usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;
		
	} else if (operating_system_platform === 'linux') {
		
		//
		//	Linux: available memory includes buffers and cache
		//
		available_memory_gb = free_memory_gb;
		usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;
		
	} else if (operating_system_platform === 'win32') {
		
		//
		//	Windows: free memory is available memory
		//
		available_memory_gb = free_memory_gb;
		usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;
		
	} else {
		
		//
		//	Other platforms: use basic calculation
		//
		available_memory_gb = free_memory_gb;
		usage_percent = ((total_memory_gb - free_memory_gb) / total_memory_gb) * 100;
	}

	//
	//	Ensure usage percentage is within valid range
	//
	usage_percent = Math.max(0, Math.min(100, usage_percent));

	//
	//	--> return memory usage information
	//
	return {
		usage_percent: usage_percent,
		available_gb: available_memory_gb,
		total_gb: total_memory_gb
	};
}

module.exports = calculate_ram_usage_internal;
