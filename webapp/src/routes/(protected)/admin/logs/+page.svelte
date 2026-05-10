<script>
	import add from '$lib/assets/icons/add.svg';
	import filter from '$lib/assets/icons/filter.svg';
	import locker from '$lib/assets/icons/locker_light.svg';
	import sort from '$lib/assets/icons/sort.svg';
	import search from '$lib/assets/icons/search.svg';

	import Modal from '$lib/components/modal.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import TableRow from '$lib/components/table_row_log.svelte';

	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	const parcels = useQuery(api.parcels.getParcels, {});

	let searchValue = $state('');

	let isNavbarActive = $state(true);
	let isAddLockerActive = $state(false);
</script>

<!-- Add Locker Modal -->
{#snippet modal_content()}
	<div class="text-center">
		<h1 class="text-mlb-orange mb-4 text-4xl font-bold">Add Parcel to Locker</h1>

		<div class="my-10">
			<p class="mb-8 text-2xl font-bold">Insert Free Locker Number Here</p>
			<form class="flex w-full flex-col items-center justify-center p-3">
				<label for="tracking_num" class="w-full text-lg font-bold"
					>Input Parcel Tracking Number Here:</label
				>
				<input
					type="text"
					id="tracking_num"
					class="bg-mlb-gray/50 text-mlb-black hover:border-mlb-orange/60 mt-4 w-3/4 w-100 rounded-3xl border-1 border-white px-2 py-1.5 text-center"
					placeholder="RR123456785PH"
				/>
			</form>
		</div>

		<button
			class="bg-mlb-orange text-mlb-white text-l m-3 rounded-2xl px-7 py-3 font-medium drop-shadow-sm hover:brightness-90"
		>
			Add
		</button>
	</div>
{/snippet}

{#if isAddLockerActive}
	<Modal {modal_content} bind:active={isAddLockerActive} />
{/if}

<div class="bg-mlb-gray/30 relative flex h-screen w-screen flex-row">
	<Navbar bind:active={isNavbarActive} />

	<div class="z-0 flex flex-col py-12 pr-12 pl-16 {isNavbarActive ? 'w-4/5' : 'w-full'}">
		<!-- Title & Utilities -->
		<div class="text-mlb-black mb-2 flex h-1/10 flex-row pr-4">
			<div class="w-3/5 place-content-center text-3xl font-bold">Parcel Logs</div>

			<div class="flex w-2/5">
				<button class="flex w-1/10 place-content-center">
					<img src={filter} class="max-w-8" alt="Filter" />
				</button>

				<button class="flex w-1/10 place-content-center">
					<img src={sort} class="max-w-8" alt="Sort" />
				</button>

				<button class="bg-mlb-gray/50 m-4 flex w-4/5 flex-row rounded-full px-4 py-2">
					<img src={search} class="s-1/5 mr-2 flex" alt="Search" />
					<input
						type="text"
						placeholder="Search..."
						class="flex w-7/8 text-sm"
						bind:value={searchValue}
					/>
				</button>
			</div>
		</div>

		<!-- Header for the Logs -->
		<div class="mb-4 flex w-full flex-row pr-4">
			<div class="w-1/5 content-center text-center text-lg font-bold">Parcel Tracking Number</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Recipient ID</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Most Recent Activity</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Date of Activity</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Parcel Details</div>
		</div>

		<!-- Content (Actual Logs) -->
		<div class="flex h-8/10 w-full flex-col overflow-auto pr-4">
			{#if parcels.isLoading}
				<p>Loading...</p>
			{:else if parcels.error}
				<p>failed to load: {parcels.error.toString()}</p>
			{:else}
				{#each parcels.data as parcel (parcel.tracking_id)}
					<TableRow
						tracking_id={parcel.tracking_id}
						recipient_uid={parcel.recipient_uid}
						delivered_by={parcel.delivered_by}
						in_locker_by={parcel.in_locker_by}
						claim_by={parcel.claim_by}
						claim_date={parcel.claim_date}
						storage_date={parcel.storage_date}
						status={parcel.status}
					/>
				{/each}
			{/if}
		</div>
	</div>
</div>
