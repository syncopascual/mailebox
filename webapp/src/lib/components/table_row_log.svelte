<script>
	import Modal from './modal.svelte';

	let {
		tracking_id = 'PH1234',
		recipient_uid = '1234',
		delivered_by = 'Aug 22',
		in_locker_by = 'ddd',
		claim_date = 'ddd',
		storage_date = 'ddd',
		status = ''
	} = $props();

	let date_of_action = $derived.by(() => {
		let date_of_action = 'N/A';
		switch (status) {
			case 'Claimed':
				date_of_action = claim_date;
				break;
			case 'In Locker':
				date_of_action = in_locker_by;
				break;
			case 'In Storage':
				date_of_action = storage_date;
				break;
			case 'Sorting':
				date_of_action = delivered_by;
				break;
			case 'In Transit':
				date_of_action = 'N/A';
				break;
		}

		if (date_of_action != 'N/A') 
			date_of_action = new Date(parseInt(date_of_action)).toUTCString();

		return date_of_action;
	}),
		progress = $derived.by(() => {
			let progress = 1;
			switch (status) {
				case 'Claimed':
					progress = 4;
					break;
				case 'In Locker':
					progress = 3;
					break;
				case 'In Storage':
					progress = 5;
					break;
				case 'Sorting':
					progress = 2;
					break;
				case 'In Transit':
					break;
			}

			return progress;
		});

	let isDetailsActive = $state(false);
</script>

<div
	class="bg-mlb-white border-mlb-white hover:border-mlb-orange mb-2 flex h-1/12 w-full shrink-0 flex-row rounded-2xl border-2 hover:shadow-sm"
>
	<div class="w-1/5 content-center text-center font-bold">
		{tracking_id}
	</div>

	<div class="w-1/5 content-center text-center">
		{recipient_uid}
	</div>

	<div class="flex w-2/5 flex-row text-sm">
		<div class="flex w-1/2 place-content-center items-center">
			{status}
		</div>
		<div class="flex w-1/2 place-content-center items-center text-center">
			{date_of_action}
		</div>
	</div>

	<div class="w-1/5 content-center text-center">
		<button
			class="bg-mlb-orange text-mlb-white disabled:bg-mlb-gray rounded-lg px-3 py-1 font-bold drop-shadow-sm enabled:hover:brightness-90"
			onclick={() => {
				isDetailsActive = true;
			}}
		>
			View Details
		</button>
	</div>
</div>

<!-- Locker Override Modal -->
{#snippet modal_content()}
	<div class="w-3/4 text-center">
		<h1 class="text-mlb-black mb-8 text-4xl font-bold">Parcel {tracking_id} Log</h1>

		<h1 class="text-mlb-orange mb-6 text-2xl font-bold">
			Status: <span class="font-semibold underline">{status}</span>
		</h1>

		<div class="bg-mlb-orange/10 my-4 rounded-lg p-4 text-base">
			<div class="my-2 flex w-full flex-row p-2 text-xl">
				<div class="w-2/5 font-bold">Activity</div>
				<div class="w-3/5 font-bold">Date</div>
			</div>

			{#if progress > 1}
			<div class="border-mlb-orange my-2 flex w-full flex-row rounded-lg border-2 p-2">
				<div class="w-2/5 font-bold">Delivered to Post Office</div>
				<div class="w-3/5 place-content-center items-center">
					{new Date(parseInt(delivered_by)).toUTCString()}
				</div>
			</div>
			{/if}

			{#if progress > 2}
			<div class="border-mlb-orange my-2 flex w-full flex-row rounded-lg border-2 p-2">
				<div class="w-2/5 font-bold">Stored in Locker</div>
				<div class="w-3/5 place-content-center items-center">
					{new Date(parseInt(in_locker_by)).toUTCString()}
				</div>
			</div>
			{/if}

			{#if progress == 4}
			<div class="border-mlb-orange my-2 flex w-full flex-row rounded-lg border-2 p-2">
				<div class="w-2/5 font-bold">Claimed by Recipient</div>
				<div class="w-3/5 place-content-center items-center">
					{new Date(parseInt(claim_date)).toUTCString()}
				</div>
			</div>
			{/if}

			{#if progress == 5}
			<div class="border-mlb-orange my-2 flex w-full flex-row rounded-lg border-2 p-2">
				<div class="w-2/5 font-bold">Stored in Storage</div>
				<div class="w-3/5 place-content-center items-center">
					{new Date(parseInt(storage_date)).toUTCString()}
				</div>
			</div>
			{/if}
		</div>
	</div>
{/snippet}

{#if isDetailsActive}
	<Modal {modal_content} bind:active={isDetailsActive} />
{/if}
