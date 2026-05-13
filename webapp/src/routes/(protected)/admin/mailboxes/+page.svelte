<script>
	import add from '$lib/assets/icons/add.svg';
	import filter from '$lib/assets/icons/filter.svg';
	import locker from '$lib/assets/icons/locker_light.svg';
	import sort from '$lib/assets/icons/sort.svg';
	import search from '$lib/assets/icons/search.svg';

	import Modal from '$lib/components/modal.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import TableRow from '$lib/components/table_row_mailbox.svelte';

	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	const mailboxes = useQuery(api.mailboxes.getMailboxes, {});

	// first available locker
	const freeLockers = useQuery(api.mailboxes.getAvailableMailboxes, {});
	// client so we can add parcel to locker
	const client = useConvexClient();
	// states for the modal and stuff
	let trackingInput = $state('');
	let errorMsg = $state('');
	let selectedLocker = $state(null);
	$effect(() => {
		if (!isAddLockerActive) {
			trackingInput = '';
			errorMsg = '';
		}
	});

	async function handleAddParcel() {
		errorMsg = '';
		if (!trackingInput.trim()) {
			errorMsg = 'Input a tracking number';
			return;
		}
		if (!selectedLocker) {
			errorMsg = 'No available locker selected';
			return;
		}

		try {
			await client.mutation(api.mailboxes.addParcelToLocker, {
				locker_number: selectedLocker,
				tracking_id: trackingInput.trim()
			});
			isAddLockerActive = false;
		} catch (err) {
			errorMsg = err.message || 'Add parcel error';
		}
	}

	let searchValue = $state('');

	let isNavbarActive = $state(true);
	let isAddLockerActive = $state(false);
</script>

<!-- Add Locker Modal -->
{#snippet modal_content()}
	<div class="text-center">
		<h1 class="text-mlb-orange mb-4 text-4xl font-bold">Add Parcel to Locker</h1>

		<div class="my-10">
			{#if freeLockers.isLoading}
				<p class="mb-8 text-2xl font-bold">Searching for free lockers...</p>
			{:else if freeLockers.error}
				<p class="mb-8 text-2xl font-bold">locker loading error</p>
			{:else if freeLockers.data}
				<label for="locker_select" class="w-full text-lg font-bold"
					>Select Available Locker:</label
				>
				<select
					id="locker_select"
					class="bg-mlb-gray/50 text-mlb-black hover:border-mlb-orange/60 rounded-3xl border-1 border-white px-2 py-1.5 text-center"
					bind:value={selectedLocker}
				>
					<option value={null} disabled>-- Choose a locker --</option>
					{#each freeLockers.data as locker (locker.locker_number)}
						<option value={locker.locker_number}>
							Locker {locker.locker_number}
						</option>
					{/each}
				</select>
			{:else}
				<p class="mb-8 text-2xl font-bold">No available lockers</p>
			{/if}

			<form class="flex w-full flex-col items-center justify-center p-3">
				<label for="tracking_num" class="w-full text-lg font-bold"
					>Input Parcel Tracking Number Here:</label
				>
				<input
					type="text"
					id="tracking_num"
					class="bg-mlb-gray/50 text-mlb-black hover:border-mlb-orange/60 mt-4 w-3/4 w-100 rounded-3xl border-1 border-white px-2 py-1.5 text-center"
					placeholder="RR123456785PH"
					bind:value={trackingInput}
				/>
			</form>
		</div>

		<button
			class="bg-mlb-orange text-mlb-white text-l m-3 rounded-2xl px-7 py-3 font-medium drop-shadow-sm hover:brightness-90"
			onclick={handleAddParcel}
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
			<div class="w-3/5 place-content-center text-3xl font-bold">Mailboxes</div>

			<div class="flex w-2/5">
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

				<div class="flex w-1/4 place-content-center items-center">
					<button
						class="bg-mlb-orange/90 text-mlb-white flex place-content-center items-center rounded-3xl px-4 py-2 font-bold hover:brightness-90"
						onclick={() => {
							isAddLockerActive = true;
						}}
					>
						<img src={add} class="max-w-8" alt="Add" />
						<img src={locker} class="max-w-8" alt="Mailbox" />
					</button>
				</div>
			</div>
		</div>

		<!-- Header for the Logs -->
		<div class="mb-4 flex w-full flex-row pr-4">
			<div class="w-1/8 content-center text-center text-lg font-bold">Locker Number</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Recipient ID</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Delivered By</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Claim By</div>

			<div class="w-1/8 content-center text-center text-lg font-bold">Status</div>

			<div class="w-1/5 content-center text-center text-lg font-bold">Unlock</div>
		</div>

		<!-- Content (Actual Logs) -->
		<div class="flex h-8/10 w-full flex-col overflow-auto pr-4">
			{#if mailboxes.isLoading}
				<p>Loading...</p>
			{:else if mailboxes.error}
				<p>failed to load: {mailboxes.error.toString()}</p>
			{:else}
				{#each mailboxes.data as mailbox (mailbox.locker_number)}
					<TableRow
						locker_num={mailbox.locker_number.toString()}
						recipient_uid={mailbox.recipient_uid}
						delivered_date={mailbox.parcel_info ? mailbox.parcel_info.delivered_by : 'N/A'}
						claim_by={mailbox.parcel_info ? mailbox.parcel_info.claim_by : 'N/A'}
						status={mailbox.status}
					/>
				{/each}
			{/if}
		</div>
	</div>
</div>
