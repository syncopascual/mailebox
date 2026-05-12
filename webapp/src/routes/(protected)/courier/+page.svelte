<script>
	import add from '$lib/assets/icons/add.svg';
	import filter from '$lib/assets/icons/filter.svg';
	import locker from '$lib/assets/icons/locker_light.svg';
	import sort from '$lib/assets/icons/sort.svg';
	import search from '$lib/assets/icons/search.svg';
	import logo from '$lib/assets/mlb_logo.png';

	import Modal from '$lib/components/modal.svelte';
	import TableRow from '$lib/components/table_row_courier.svelte';

	import { useQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { api } from '$convex/_generated/api.js';

	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);
	const currentUserResponse = useQuery(api.auth.getCurrentUser, () =>
		isAuthenticated ? {} : 'skip'
	);
	let user = $derived(currentUserResponse.data);


	const parcels = useQuery(api.courier.getParcelsForCourier, () => ({
		courier_id: user ? user._id : ""
	}));

	let searchValue = $state('');

	let hideDelivered = $state(false);
</script>

<div
	class="from-mlb-blue/20 to-mlb-orange/20 relative flex h-screen w-screen flex-row bg-linear-to-t"
>
	<div class="z-0 flex w-full flex-col overflow-x-auto py-6 pr-2 pl-6 md:pr-12 md:pl-16">
		<!-- <img src={logo} alt="MaiLeBox logo" class="max-w-40 pt-5" /> -->

		<div class="text-mlb-black mb-2 flex h-1/10 w-full min-w-[700px] flex-row pr-4">
			<div class="place-content-center text-3xl font-bold">Parcels</div>

			<div class="ml-auto flex">
				<button class="flex w-1/10 place-content-center">
					<img src={filter} class="max-w-8" alt="Filter" />
				</button>

				<button class="flex w-1/10 place-content-center">
					<img src={sort} class="max-w-8" alt="Sort" />
				</button>

				<button class="bg-mlb-gray/50 m-4 flex w-3/5 flex-row rounded-full px-4 py-2">
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

		<div class="flex flex-row items-center">
			<input
				id="hideDelivered"
				type="checkbox"
				bind:checked={hideDelivered}
				class="accent-mlb-orange h-4 w-4"
			/>
			<label for="hideDelivered" class="pl-2"> Hide Delivered Parcels </label>
		</div>

		<div class="mb-4 flex min-w-[700px] flex-row items-center justify-center">
			<div class="w-1/5 content-center text-center text-lg font-bold">Parcel Number</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Assigned Locker</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Recipient</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Status</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Unlock</div>
		</div>

		<div class="flex h-8/10 w-full min-w-[700px] flex-col overflow-auto">
			<!-- <TableRow />
			<TableRow />
			<TableRow status='Claimed'/>
			<TableRow status='In Locker'/> -->

			{#if parcels.isLoading}
				<p>Loading...</p>
			{:else if parcels.error}
				<p>failed to load: {parcels.error.toString()}</p>
			{:else}
				{#each parcels.data as parcel (parcel.tracking_id)}
					{#if hideDelivered}
						{#if parcel.status == 'Sorting'}
							<TableRow
								locker_num={parcel.mailbox_info?.locker_number.toString() ?? 'N/A'}
								parcel_num={parcel.tracking_id.toString()}
								recipient_uid={parcel.recipient_uid}
								status={parcel.status}
							/>
						{/if}
					{:else}
						<TableRow
							locker_num={parcel.mailbox_info?.locker_number.toString() ?? 'N/A'}
							parcel_num={parcel.tracking_id.toString()}
							recipient_uid={parcel.recipient_uid}
							status={parcel.status}
						/>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
</div>
