<script>
	import stripes from '$lib/images/bg-animations/b&w-stripes-animation.mp4?url';

	let { data } = $props();

	let now = $state(new Date());

	$effect(() => {
		let id;
		const tick = () => {
			now = new Date();
			id = setTimeout(tick, 1000 - now.getMilliseconds());
		};
		id = setTimeout(tick, 1000 - now.getMilliseconds());
		return () => clearTimeout(id);
	});

	const pad = (n) => String(n).padStart(2, '0');
	const timeStr = $derived(
		`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
	);
	const dateStr = $derived(
		now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
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
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="dashboard">
	<video class="bg" src={stripes} autoplay muted loop playsinline></video>

	<main>
		<div class="clock">
			<span class="time">{timeStr}</span>
			<span class="date">{dateStr}</span>
		</div>

		{#if data.weather}
			<div class="weather">
				<span class="weather-icon">{weatherGlyph}</span>
				<div class="weather-info">
					<span class="temp">{Math.round(data.weather.temp_c)}<span class="unit">&deg;C</span></span
					>
					<span class="cond">{data.weather.text}</span>
				</div>
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
	}

	.time {
		font-family: 'DSEG7';
		font-size: min(15vw, 28vh);
		line-height: 1;
		letter-spacing: 0.03em;
		color: #fff;
		text-shadow: 0 0 24px rgba(255, 255, 255, 0.35);
	}

	.date {
		margin-top: 0.5em;
		font-size: clamp(1rem, 2.4vw, 2rem);
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
	}

	.weather {
		position: absolute;
		right: 2rem;
		bottom: 2rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		background: rgba(0, 0, 0, 0.55);
		border-radius: 0.5rem;
		backdrop-filter: blur(4px);
	}

	.weather-icon {
		font-family: 'DSEGWeather';
		font-size: 3rem;
		line-height: 1;
	}

	.weather-info {
		display: flex;
		flex-direction: column;
	}

	.temp {
		font-family: 'DSEG7';
		font-size: 2rem;
		line-height: 1;
	}

	.unit {
		font-family: var(--font-body);
		font-size: 1rem;
		margin-left: 0.15em;
	}

	.cond {
		font-size: 0.9rem;
		opacity: 0.85;
	}

	@media (max-width: 640px) {
		.weather {
			right: 1rem;
			bottom: 1rem;
		}
	}
</style>
