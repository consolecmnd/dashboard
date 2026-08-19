<script>
	import stripes from '$lib/images/bg-animations/b&w-stripes-animation.mp4?url';
	import diagonal from '$lib/images/bg-animations/diagonal-stripes-animation.mp4?url';

	let { data: initialData } = $props();

	let data = $state(initialData);
	let lastUpdated = $state(new Date());

	const VIDEOS = [stripes, diagonal];

	let now = $state(new Date());
	let blink = $state(true);
	let videoIdx = $state(Math.floor(Math.random() * VIDEOS.length));

	let appVersion = $state('');
	let showForecast = $state(false);
	let cycleStart = Date.now();

	function toggleForecast() {
		showForecast = !showForecast;
		cycleStart = Date.now();
	}

	$effect(() => {
		let cancelled = false;

		function tick() {
			if (cancelled) return;
			const elapsed = Date.now() - cycleStart;
			if (!showForecast && elapsed >= 720_000) {
				showForecast = true;
				cycleStart = Date.now();
			} else if (showForecast && elapsed >= 180_000) {
				showForecast = false;
				cycleStart = Date.now();
			}
			id = setTimeout(tick, 1000);
		}

		let id = setTimeout(tick, 1000);
		return () => {
			cancelled = true;
			clearTimeout(id);
		};
	});

	$effect(() => {
		let cancelled = false;

		async function checkVersion() {
			try {
				const res = await fetch('/_app/version.json', { cache: 'no-store' });
				if (!res.ok) return;
				const { version } = await res.json();
				if (!cancelled && appVersion && version !== appVersion) {
					location.reload();
				}
				appVersion = version;
			// eslint-disable-next-line no-empty
			} catch {}
		}

		checkVersion();
		const id = setInterval(checkVersion, 300_000);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	});

	$effect(() => {
		let cancelled = false;

		async function refresh() {
			try {
				const res = await fetch('/api/data', { cache: 'no-store' });
				if (!res.ok) return;
				const updated = await res.json();
				if (!cancelled) {
					data = updated;
					lastUpdated = new Date();
				}
			// eslint-disable-next-line no-empty
			} catch {}
		}

		const id = setInterval(refresh, 600_000);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	});

	$effect(() => {
		let id;
		let lastHour = now.getHours();
		const tick = () => {
			now = new Date();
			blink = !blink;

			const h = now.getHours();
			if (h !== lastHour) {
				lastHour = h;
				let next;
				do {
					next = Math.floor(Math.random() * VIDEOS.length);
				} while (next === videoIdx && VIDEOS.length > 1);
				videoIdx = next;
			}

			id = setTimeout(tick, 1000 - now.getMilliseconds());
		};
		id = setTimeout(tick, 1000 - now.getMilliseconds());
		return () => clearTimeout(id);
	});

	const pad = (n) => String(n).padStart(2, '0');
	const hours = $derived(pad(now.getHours() % 12 || 12));
	const minutes = $derived(pad(now.getMinutes()));
	const dayStr = $derived(now.toLocaleDateString(undefined, { weekday: 'long' }));
	const dateStr = $derived(now.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
		// now.toLocaleDateString(undefined, { weekday: 'long' } +  { month: 'long', day: 'numeric', year: 'numeric' })
	);

	// WeatherAPI condition code -> DSEGWeather glyph (1=sun, 2=cloud, 3=rain,
	// 4=hard rain, 5=snow, 6/7/8=thunder, 9=sun+cloud)
	const GLYPHS = {
		1000: '1',
		1003: '9',
		1006: '2',
		1009: '2',
		1030: '2',
		1063: '3',
		1066: '5',
		1069: '5',
		1072: '3',
		1087: '8',
		1114: '5',
		1117: '5',
		1135: '2',
		1147: '2',
		1150: '3',
		1153: '3',
		1168: '3',
		1171: '3',
		1180: '3',
		1183: '3',
		1186: '4',
		1189: '4',
		1192: '4',
		1195: '4',
		1201: '4',
		1204: '3',
		1207: '4',
		1210: '5',
		1213: '5',
		1216: '5',
		1219: '5',
		1222: '5',
		1225: '5',
		1237: '5',
		1240: '3',
		1243: '4',
		1246: '4',
		1249: '5',
		1252: '5',
		1255: '5',
		1258: '5',
		1261: '5',
		1264: '5',
		1273: '6',
		1276: '7',
		1279: '6',
		1282: '6'
	};

	const weatherGlyph = $derived(data.weather ? (GLYPHS[data.weather.code] ?? '2') : '');

	const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function forecastGlyph(code) {
		return GLYPHS[code] ?? '2';
	}
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="dashboard">
	<video class="bg" src={VIDEOS[videoIdx]} autoplay muted loop playsinline></video>

	<main ondblclick={toggleForecast}>
		{#if showForecast && data.weather?.forecast}
			<div class="forecast">
			{#each data.weather.forecast as day, i (day.date)}
				<div class="forecast-day">
					<span class="forecast-label">{i === 0 ? 'Today' : DAY_NAMES[new Date(day.date + 'T12:00:00').getDay()]}</span>
						<span class="forecast-icon">{forecastGlyph(day.code)}</span>
						<span class="forecast-hi">{Math.round(day.max_c)}&deg;</span>
						<span class="forecast-lo">{Math.round(day.min_c)}&deg;</span>
					</div>
				{/each}
			</div>

			<div class="clock-mini">
				<span class="time-mini">{hours}<span class="colon" class:off={blink}>:</span>{minutes}</span>
			</div>
		{:else}
		<div class="clock">
			<div class="time">
				<span class="time-ghost">00:00</span>
				{hours}<span class="colon" class:off={blink}>:</span>{minutes}
			</div>
				<span class="dateWrapper">
					<span class="day seven-seg">{dayStr}</span>
					<span class="date">{dateStr}</span>
				</span>
			</div>

			{#if data.weather}
				<div class="weather">
					<span class="weather-icon"><span class="weather-icon-ghost">0</span>{weatherGlyph}</span>
					<div class="weather-info">
						<div class="temp-group">
							<span class="temp">{Math.round(data.weather.temp_c)}<span class="unit"><sup>&deg;C</sup></span></span>
							<span class="hi-lo">H: {Math.round(data.weather.max_c)}&deg;<br />L: {Math.round(data.weather.min_c)}&deg;</span>
						</div>
						<span class="cond seven-seg">{data.weather.text}</span>
					</div>
				</div>
			{/if}
		{/if}

		{#if data.aqi}
			<div class="aqi">
				<span class="aqi-value-wrapper">
					<span class="aqi-value">{data.aqi.value}
						<span class="status-ghost">0</span>
					</span>
					<span class="aqi-risk seven-seg">{data.aqi.risk}</span>
				</span>
				<span class="aqi-msg  seven-seg">{data.aqi.message}</span>
			</div>
		{/if}

		{#if lastUpdated}
			<div class="status">
				<span class="seven-seg status-title">Last Update<br /><span class="status-time">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
			</div>
		{/if}
	</main>
</div>

<style>
	.dashboard {
		position: relative;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		background: #000;
		color: #fff;
	}

	.bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	.seven-seg {
		font-family: 'Seven Segment';
	}

	main {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1.5rem;
	}

	.clock {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		margin-top: -40px;
	}

	.time {
		position: relative;
		font-family: 'DSEG7';
		font-size: min(27vw, 50vh);
		line-height: 1;
		letter-spacing: 0.03em;
		color: #fff;
		text-shadow: 1px 1px 30px rgba(255, 255, 255, 0.65);
		filter: drop-shadow(3px 3px 4px #000);
	}

	.time-ghost {
		position: absolute;
		inset: 0;
		opacity: 0.15;
		pointer-events: none;
		color: #000;
		z-index: -1;
	}

	.colon {
		/* transition: opacity 0.1s; */
		
	}

	.colon.off {
		opacity: 0.15;
		color: black;
		/* opacity: 1; */
	}

	.dateWrapper {
		position: absolute;
		top: 0.8rem;
		left: 1rem;
		white-space: pre-line;
		text-align: left;
		line-height: 1.1;
		width: 200px;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
	}

	.date {
		font-family: 'DSEG7';
		font-size: clamp(1rem, 8vw, 1.3rem);
	}
	
	.day {
		font-size: clamp(1rem, 8vw, 1.5rem);		
	}

	.weather {
		position: absolute;
		right: 1rem;
		bottom: 0.5em;
		display: flex;
		gap: 10px;
		padding: 1px 5px;
		background: rgba(0, 0, 0, 0.55);
		border-radius: 0.5rem;
		backdrop-filter: blur(4px);
    align-items: center;
		flex-direction: row;
		height: 90px;
    width: 39vw;
    justify-content: center;
	}

	.weather-icon {
		position: relative;
		font-family: 'DSEGWeather';
		gap: 5px;
		z-index: 1;
		opacity: 1;
		font-size: clamp(1rem, 16vw, 5rem);
	}

	.weather-icon-ghost {
		position: absolute;
		inset: 0;
		opacity: 0.3;
		z-index: -1;
		color: black;
		pointer-events: none;
	}

	.weather-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
	}

	.temp {
		font-family: 'DSEG7';
		font-size: 2rem;
		line-height: 1;
	}

	.temp-group {
		display: flex;
    align-content: center;
		gap: 5px;
    height: 40px;
    align-items: center;
	}

	.unit {
		font-family: 'DSEG7';
		font-size: 1rem;
		margin-left: 0.15em;
	}

	.cond {
		font-size: 1rem;
		text-align: center;
	}

	.hi-lo {
		font-family: 'DSEG7';
		font-size: 0.85rem;
		text-align: center;
    line-height: 1.5;
	}

	.aqi {
		bottom: 0.5em;
		left: 1em;
		position: absolute;
		display: flex;
		flex-direction: row;
		gap: 4px;
		padding: 1px 10px;
		background: rgba(0, 0, 0, 0.55);
		border-radius: 0.5rem;
		backdrop-filter: blur(4px);
		max-width: 35vw;
		width: 100%;
		align-items: center;
		text-align: center;
		height: 90px;
	}

	.aqi-value-wrapper {
		display: flex;
		flex-direction: column;
		gap: 10px;
		position: relative;
		width: 100px;
	}
	.aqi-value {
		font-family: 'DSEG7';
		font-size: 2rem;
	}
	
	.aqi-risk {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.aqi-msg {
		font-size: 0.85rem;
		line-height: 1.3;
	}

	.forecast {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.55);
		border-radius: 0.75rem;
		backdrop-filter: blur(4px);
	}

	.forecast-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		min-width: 4rem;
	}

	.forecast-label {
		font-size: 0.8rem;
		text-transform: uppercase;
	}

	.forecast-icon {
		font-family: 'DSEGWeather';
		font-size: clamp(1.5rem, 4vw, 3rem);
	}

	.forecast-hi {
		font-family: 'DSEG7';
		font-size: clamp(0.9rem, 2vw, 1.4rem);
	}

	.forecast-lo {
		font-family: 'DSEG7';
		font-size: clamp(0.8rem, 1.5vw, 1.1rem);
	}

	.clock-mini {
		position: absolute;
		right: 2rem;
		bottom: 2rem;
		padding: 0.5rem 1rem;
		background: rgba(0, 0, 0, 0.55);
		border-radius: 0.5rem;
		backdrop-filter: blur(4px);
	}

	.time-mini {
		font-family: 'DSEG7';
		font-size: clamp(1.2rem, 4vw, 2.5rem);
		line-height: 1;
	}

	.status {
		font-family: 'DSEG7';
		position: absolute;
		top: 0.9rem;
		right: 2rem;
		font-size: clamp(1rem, 7vw, 1rem);
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
		line-height: 1.2;
		text-align: right;
	}

	.status-ghost {
		position: absolute;
		left: 5px;
		opacity: 0.3;
		pointer-events: none;
		color: #000;
		z-index: -1;
	}	

	.status-title {}
	.status-time {
		font-size: 1.6rem;
	}
</style>
