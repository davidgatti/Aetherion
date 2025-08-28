import * as os from 'os';

//
//	Interface for RAM usage information
//
interface RamUsageInfo {
	usage_percent: number;
	available_gb: number;
	total_gb: number;
}

//
//	Calculate RAM usage percentage and memory information
//
export default async function(): Promise<RamUsageInfo> {
	
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
	//	Calculate usage based on operating system
	//
	if (operating_system_platform === 'darwin') {
		
		//
		//	Handle macOS memory calculation
		//
		let macos_used_memory = total_memory_bytes - free_memory_bytes;
		let estimated_cached_memory = Math.min(macos_used_memory * 0.5, total_memory_bytes * 0.4);
		let actual_used_memory = macos_used_memory - estimated_cached_memory;
		
		usage_percent = (actual_used_memory / total_memory_bytes) * 100;
		available_memory_gb = (total_memory_bytes - actual_used_memory) / (1024 * 1024 * 1024);
		
	} else if (operating_system_platform === 'linux') {
		
		//
		//	Handle Linux memory calculation
		//
		usage_percent = ((total_memory_bytes - free_memory_bytes) / total_memory_bytes) * 100;
		available_memory_gb = free_memory_gb;
		
	} else if (operating_system_platform === 'win32') {
		
		//
		//	Handle Windows memory calculation
		//
		usage_percent = ((total_memory_bytes - free_memory_bytes) / total_memory_bytes) * 100;
		available_memory_gb = free_memory_gb;
		
	} else {
		
		//
		//	Handle other platforms with fallback calculation
		//
		usage_percent = ((total_memory_bytes - free_memory_bytes) / total_memory_bytes) * 100;
		available_memory_gb = free_memory_gb;
	}
	
	//
	//	Ensure reasonable bounds for calculated values
	//
	usage_percent = Math.max(0, Math.min(100, usage_percent));
	available_memory_gb = Math.max(0, available_memory_gb);
	
	//
	//	--> return memory usage information
	//
	return {
		usage_percent: usage_percent,
		available_gb: available_memory_gb,
		total_gb: total_memory_gb
	};
};
