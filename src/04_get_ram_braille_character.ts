//
//	Convert RAM usage percentage to braille character
//
export default async function(ram_usage_percent: number): Promise<string> {
	
	//
	//	Validate input parameter
	//
	if (typeof ram_usage_percent !== 'number') {
		
		//
		//	^^^ invalid usage percentage provided
		//
		throw new Error('ram-usage-must-be-number');
	}

	//
	//	Map usage percentage to braille character (same as CPU)
	//
	if (ram_usage_percent < 10) {
		
		//
		//	--> return empty braille for very low usage
		//
		return '⣀';
	}
	
	if (ram_usage_percent < 20) {
		
		//
		//	--> return bottom dots for low usage
		//
		return '⣄';
	}
	
	if (ram_usage_percent < 40) {
		
		//
		//	--> return bottom half filled for moderate usage
		//
		return '⣤';
	}
	
	if (ram_usage_percent < 60) {
		
		//
		//	--> return most filled for high usage
		//
		return '⣶';
	}
	
	if (ram_usage_percent < 80) {
		
		//
		//	--> return almost complete for very high usage
		//
		return '⣷';
	}

	//
	//	--> return full braille block for maximum usage
	//
	return '⣿';
};
