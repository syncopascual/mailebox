<script>
	import Modal from './modal.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';

	const client = useConvexClient();

	async function handleConfirm() {
		await client.action(api.mqtt.publishOpen, { ID: locker_num, command: 'open' });
		isOverrideActive = false; // close the modal
	}

	let {
		locker_num = '24',
		recipient_uid = 'DELA CRUZ, Juan A.',
		delivered_date = 'April 28, 2026',
		claim_by = 'May 5, 2026',
		status = 'In Locker'
	} = $props();

	// Calculation of Date Difference (for claiming)
	var date_deli = $derived.by(() => {
			if (delivered_date != "N/A")
				return new Date(parseInt(delivered_date));
			else 
				return "N/A";
		}),
		date_claim = $derived.by(() => {
			if (claim_by != "N/A")
				return new Date(parseInt(claim_by));
			else
				return "N/A";
		}),
		output_deli = $derived.by(() => {
			if (date_deli != "N/A") 
				return date_deli.toUTCString();
			else
				return "N/A";
		}),
		output_claim = $derived.by(() => {
			if (date_claim != "N/A") {
				return date_claim.toUTCString();
			}
			else
				return "N/A";
		}),
		hrs = $derived.by(() => {
			if (delivered_date != "N/A" && claim_by != "N/A") {
				let hrs = Math.floor((date_claim - Date.now()) / 3600000);
				
				if (hrs < 0) {
					hrs *= -1;
				}

				return hrs;
			}

			return "N/A";
		}),
		days = $derived.by(() => {
			if (delivered_date != "N/A" && claim_by != "N/A") {
				return Math.floor(hrs/24);;
			}

			return "N/A";
		}),
		isClaimPeriodFinished = $derived.by(() => {
			if (delivered_date != "N/A" && claim_by != "N/A") {
				let hrs = Math.floor((date_claim - Date.now()) / 3600000);
				
				if (hrs < 0) {
					return true;
				}
			}
			return false;
		});

	// console.log(`Past Deadline? ${isClaimPeriodFinished}, days: ${days}, hours: ${hrs}`);

	let isOverrideActive = $state(false);
</script>

<div
	class="bg-mlb-white border-mlb-white hover:border-mlb-orange mb-2 flex h-1/12 w-full shrink-0 flex-row rounded-2xl border-2 hover:shadow-sm"
>
	<div class="w-1/8 content-center text-center font-bold">
		{locker_num}
	</div>

	<div class="w-1/5 content-center text-center">
		{recipient_uid ? recipient_uid : "N/A"}
	</div>

	<div class="w-1/5 content-center text-center">
		{output_deli}
	</div>

	<div class="w-1/5 content-center text-center">
		{output_claim}
	</div>

	<div class="w-1/8 content-center text-center text-sm">
		{status}
	</div>

	<div class="w-1/5 content-center text-center text-sm">
		<button
			class="bg-mlb-orange text-mlb-white disabled:bg-mlb-gray rounded-lg px-3 py-1 font-bold drop-shadow-sm enabled:hover:brightness-90"
			onclick={() => {
				isOverrideActive = true;
			}}
		>
			Unlock
		</button>
	</div>
</div>

<!-- Locker Override Modal -->
{#snippet modal_content()}
	<div class="text-center">
		<h1 class="text-mlb-black mb-8 text-4xl font-bold">Manual Override</h1>

		<h1 class="text-mlb-orange mb-6 text-3xl font-bold">Unlock Locker {locker_num}?</h1>

		<div class="flex place-content-center flex-col bg-mlb-orange/10 my-4 rounded-lg p-4 text-base">
			<!-- <div class="font-bold text-2xl mb-2">Note:</div> -->
			{#if isClaimPeriodFinished && status == 'Unavailable'}
				<div>
					Parcel has been <span class="text-mlb-red font-bold underline">unclaimed</span> for
				</div>
				<div class="text-mlb-red mt-2 text-2xl font-bold">
					{days.toString()} days
				</div>
			{:else if !isClaimPeriodFinished && status == 'Unavailable'}
				<div>Recipient <span class="font-semibold underline">{recipient_uid}</span> has</div>
				<div class="text-mlb-orange mt-2 text-2xl font-bold">
					{days.toString()} days
				</div>
				<div>to claim their parcel</div>
			{:else}
				<div>
					This locker <span class="font-bold">does not have a parcel</span> currently.<br />Continue
					with override?
				</div>
			{/if}
		</div>

		<button
			class="{isClaimPeriodFinished
				? 'bg-mlb-green'
				: 'bg-mlb-red'} text-mlb-white text-l m-3 rounded-2xl px-7 py-3 font-bold drop-shadow-sm hover:brightness-90"
			onclick={handleConfirm}
		>
			Confirm
		</button>
	</div>
{/snippet}

{#if isOverrideActive}
	<Modal {modal_content} bind:active={isOverrideActive} />
{/if}
