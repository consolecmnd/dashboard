export async function load() {
	const apiKey = process.env.WEATHERAPI_KEY;
	const location = process.env.WEATHER_LOCATION;

	if (!apiKey) {
		return { weather: null };
	}

	const q = location || 'auto:ip';

	try {
		const res = await fetch(
			`https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}`
		);

		if (!res.ok) {
			return { weather: null };
		}

		const data = await res.json();
		const current = data.current;

		return {
			weather: {
				temp_c: current.temp_c,
				code: current.condition.code,
				text: current.condition.text
			}
		};
	} catch {
		return { weather: null };
	}
}
