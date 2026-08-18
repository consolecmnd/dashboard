import { json } from '@sveltejs/kit';
import 'dotenv/config';

const AQHI_MESSAGES = [
	{ max: 3, risk: 'Low Risk', msg: 'Ideal air quality for outdoor activities.' },
	{
		max: 6,
		risk: 'Moderate Risk',
		msg: 'No need to modify your usual outdoor activities unless you experience symptoms such as coughing and throat irritation.'
	},
	{
		max: 10,
		risk: 'High Risk',
		msg: 'Consider reducing or rescheduling strenuous outdoor activities if you experience symptoms such as coughing and throat irritation.'
	},
	{
		max: Infinity,
		risk: 'Very High Risk',
		msg: 'Reduce or reschedule strenuous activities outdoors, especially if you experience symptoms such as coughing and throat irritation.'
	}
];

function getAqhiInfo(value) {
	const rounded = Math.round(value);
	for (const tier of AQHI_MESSAGES) {
		if (rounded <= tier.max) {
			return { value: rounded, risk: tier.risk, message: tier.msg };
		}
	}
	const last = AQHI_MESSAGES[AQHI_MESSAGES.length - 1];
	return { value: rounded, risk: last.risk, message: last.msg };
}

export const prerender = false;

export async function GET() {
	const [weather, aqi] = await Promise.all([fetchWeather(), fetchAqhi()]);
	return json({ weather, aqi });
}

async function fetchWeather() {
	const apiKey = process.env.WEATHERAPI_KEY;
	const location = process.env.WEATHER_LOCATION;

	if (!apiKey) return null;

	const q = location || 'auto:ip';

	try {
		const res = await fetch(
			`https://api.weatherapi.com/v1/forecast.json?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&days=7`
		);

		if (!res.ok) return null;

		const data = await res.json();
		const current = data.current;
		const forecast = data.forecast.forecastday.map((day) => ({
			date: day.date,
			code: day.day.condition.code,
			text: day.day.condition.text,
			max_c: day.day.maxtemp_c,
			min_c: day.day.mintemp_c
		}));

		return {
			temp_c: current.temp_c,
			code: current.condition.code,
			text: current.condition.text,
			max_c: forecast[0].max_c,
			min_c: forecast[0].min_c,
			forecast
		};
	} catch {
		return null;
	}
}

async function fetchAqhi() {
	const station = process.env.AQHI_STATION || 'IAKID';
	const url = `https://dd.weather.gc.ca/today/air_quality/aqhi/pnr/observation/realtime/xml/AQ_OBS_${station}_CURRENT.xml`;

	try {
		const res = await fetch(url);

		if (!res.ok) return null;

		const xml = await res.text();
		const match = xml.match(/<airQualityHealthIndex>([\d.]+)<\/airQualityHealthIndex>/);

		if (!match) return null;

		return getAqhiInfo(parseFloat(match[1]));
	} catch {
		return null;
	}
}
