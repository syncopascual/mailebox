<script>
	import truck from '$lib/assets/icons/truck.svg';
	import storage from '$lib/assets/icons/storage.svg';
	import locker from '$lib/assets/icons/locker.svg';
	import star from '$lib/assets/icons/star.svg';

	let stat = $props();
	let states = ['In Transit', 'Sorting', 'In Locker', 'Claimed'];
	let status = $derived(states.indexOf(stat.stat) + 1);
</script>

<div class="flex h-auto w-full items-center">
	<div
		class="border-mlb-orange ml-2 flex aspect-square size-1/4 place-content-center items-center rounded-full border-3 border-solid {status >=
		1
			? 'opacity-100'
			: 'opacity-50'}"
	>
		<img src={truck} alt="Truck Icon" class="size-3/4" />
	</div>

	<div class="bg-mlb-blue h-1 w-1/8 {status >= 2 ? 'opacity-100' : 'opacity-50'}"></div>

	<div
		class="border-mlb-orange flex aspect-square size-1/4 place-content-center items-center rounded-full border-3 border-solid {status >=
		2
			? 'opacity-100'
			: 'opacity-50'}"
	>
		<img src={storage} alt="Storage Icon" class="size-3/4" />
	</div>

	<div class="bg-mlb-blue h-1 w-1/8 {status >= 3 ? 'opacity-100' : 'opacity-50'}"></div>

	<div
		class="border-mlb-orange flex aspect-square size-1/4 place-content-center items-center rounded-full border-3 border-solid {status >=
		3
			? 'opacity-100'
			: 'opacity-50'}"
	>
		<img src={locker} alt="Locker Icon" class="size-3/4" />
	</div>

	<div class="bg-mlb-blue h-1 w-1/8 {status >= 4 ? 'opacity-100' : 'opacity-50'}"></div>

	<div
		class="border-mlb-orange mr-2 flex aspect-square size-1/4 place-content-center items-center rounded-full border-3 border-solid {status >=
		4
			? 'opacity-100'
			: 'opacity-50'}"
	>
		<img src={star} alt="Star Icon" class="size-3/4" />
	</div>
</div>

<div class="flex w-full items-center">
	{#each states as state, i (state)}
		<div
			class="mt-4 w-1/4 text-center text-xs font-semibold {status > i
				? 'opacity-100'
				: 'opacity-50'}"
		>
			{state}
		</div>
	{/each}
</div>
