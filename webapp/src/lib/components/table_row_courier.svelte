<script>
	import Modal from './modal.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	let {
		locker_num = '24',
		parcel_num = '123',
		recipient_uid = 'DELA CRUZ, Juan A.',
		status = 'For Delivery'
	} = $props();
	const client = useConvexClient();
	let isOverrideActive = $state(false);
	let errorMsg = $state('');

	function handleClick() {
		if (status == 'In Locker' || status == 'Claimed') {
			return;
		} else {
			isOverrideActive = true;
		}
	}

	async function handleDelivery(track_id){
		errorMsg = '';
		try {
			await client.mutation(api.parcels.updateParcel, {
					tracking_num: track_id,
					status: 'In Locker'
				});
			isOverrideActive = false;
			} catch (err) {
				errorMsg = err.message || 'Delivery Error';
		}	
	}
</script>

<div
	class="bg-mlb-white border-mlb-white hover:border-mlb-orange mb-2 flex h-1/10 w-full shrink-0 flex-row rounded-2xl border-2 hover:shadow-sm"
>
	<div class="w-1/5 content-center text-center font-bold">
		{parcel_num}
	</div>

	<div class="w-1/5 content-center text-center">
		{locker_num}
	</div>

	<div class="w-1/5 content-center text-center">
		{recipient_uid}
	</div>

	<div class="w-1/5 content-center text-center">
		{status}
	</div>

	<div class="w-1/5 content-center text-center">
		<button
			class="bg-mlb-orange text-mlb-white disabled:bg-mlb-gray rounded-lg px-3 py-1 font-bold drop-shadow-sm enabled:hover:brightness-90"
			onclick={handleClick}
			disabled={status != 'Sorting'}
		>
			Deliver
		</button>
	</div>
</div>

<!-- Locker Override Modal -->
{#snippet modal_content()}
	<div class="text-center">
		<h1 class="text-mlb-black mb-4 text-2xl font-bold md:mb-8 md:text-4xl">Deliver Parcel</h1>

		<h1 class="text-mlb-orange mb-3 text-xl font-bold md:mb-6 md:text-3xl">
			Deliver to Locker {locker_num}?
		</h1>

		<p class="text-mlb-black mb-4 md:mb-8">
			Please place the parcel inside the locker before pressing Deliver.
		</p>

		<button
			class="bg-mlb-orange text-mlb-white text-l m-3 rounded-2xl px-7 py-3 font-bold drop-shadow-sm hover:brightness-90"
			onclick={() => handleDelivery(parcel_num)}
			disabled={status != 'Sorting'}
		>
			Deliver
		</button>
	</div>
{/snippet}

{#if isOverrideActive}
	<Modal {modal_content} bind:active={isOverrideActive} />
{/if}
