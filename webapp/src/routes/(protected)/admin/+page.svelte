<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import TableRow from '$lib/components/table_row_unsuccessful_logs.svelte';
	import PieChart from '$lib/components/pie_chart.svelte';

	let isNavbarActive = $state(true);
</script>

<div class="bg-mlb-gray/30 relative flex h-screen w-screen">
	<Navbar bind:active={isNavbarActive}/>

	<div class="z-0 flex flex-col py-12 pr-12 pl-16 {isNavbarActive ? 'w-4/5' : 'w-full'}">
		<p class="place-content-center text-3xl font-bold pb-3"> Dashboard </p>

		<div class="flex w-full gap-x-5">
			<div class="w-1/2">
				<p class="text-xl font-bold pb-3"> Overall Stats </p>

				<div class="flex flex-row gap-x-5">
					<div class="p-2 w-1/2 bg-green-100 rounded-lg">
						<p class="font-medium"> Available Lockers </p>
						<p> 4 </p>
					</div>

					<div class="p-2 w-1/2 bg-red-100 rounded-lg">
						<p class="font-medium"> Overdue Parcels </p>
						<p> 5 </p>
					</div>
				</div>

				<PieChart />
			</div>
			
			<div class="w-1/2">
				<p class="text-xl font-bold pb-3"> Security Issues </p>

				<div class="bg-mlb-white rounded-lg">
					<!-- TABLE header -->
					<div class="p-2 flex flex-row w-full text-center font-medium">
						<p class="w-1/3"> Timestamp </p>
						<p class="w-1/3"> Locker Number </p>
						<p class="w-1/3"> UIN </p>
					</div>

					<!-- Logs -->
					<div class="p-2 flex w-full text-center">
						<TableRow />
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
