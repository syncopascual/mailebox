<script>
	import Modal from './modal.svelte';

	let {
		locker_num = '24',
		recipient_uid = 'DELA CRUZ, Juan A.',
		delivered_date = 'April 28, 2026',
		claim_by = 'May 5, 2026',
		status = 'In Locker'
	} = $props();

	// Calculation of Date Difference (for claiming)
	var isClaimPeriodFinished,
		hrs = $state(0),
		days = $state(0),
		date_deli,
		date_claim,
		output_deli = $state(''),
		output_claim = $state('');

	if (delivered_date != 'N/A' && claim_by != 'N/A') {
		date_deli = new Date(parseInt(delivered_date));
		date_claim = new Date(parseInt(claim_by));

		hrs = Math.floor((date_claim - date_deli) / 3600000);
		days = Math.floor(hrs / 24);

		console.log(days);

		// Not yet past claiming deadline
		if (hrs > 0) {
			isClaimPeriodFinished = false;
		}

		// Past claiming deadline already
		else {
			isClaimPeriodFinished = true;
			days *= -1;
			hrs *= -1;
		}

		output_deli = date_deli.toUTCString();
		output_claim = date_claim.toUTCString();
	} else {
		output_deli = delivered_date;
		output_claim = claim_by;
	}

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
		{recipient_uid}
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

		<div class="bg-mlb-orange/10 my-4 rounded-lg p-4 text-base">
			<!-- <div class="font-bold text-2xl mb-2">Note:</div> -->
			{#if isClaimPeriodFinished && status == 'Unavailable'}
				<div>
					Parcel has been <span class="text-mlb-red font-bold underline">unclaimed</span> for
				</div>
				<div class="text-mlb-red my-2 text-xl font-bold">
					{days.toString()} days, {hrs.toString()} hours
				</div>
			{:else if !isClaimPeriodFinished && status == 'Unavailable'}
				<div>Recipient <span class="font-semibold underline">{recipient_uid}</span> has</div>
				<div class="text-mlb-orange my-2 text-xl font-bold">
					{days.toString()} days, {hrs.toString()} hours
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
		>
			Confirm
		</button>
	</div>
{/snippet}

{#if isOverrideActive}
	<Modal {modal_content} bind:active={isOverrideActive} />
{/if}
