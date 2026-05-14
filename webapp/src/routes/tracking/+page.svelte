<script lang="ts">
	import logo from '$lib/assets/mlb_logo.png';
	import Modal from '$lib/components/modal.svelte';
	import StatusBar from '$lib/components/status_bar.svelte';
	import StatusDetails from '$lib/components/status_details.svelte';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	// for expandable tracking details
	let detailsOpen = $state(false);

	function handleClose() {
		detailsOpen = false;
	}

	// for QOL in entering OTP
	let otpCode = $state(['', '', '', '', '', '']);
	let isActive = $state(false);

	function autoFocus(event) {
		let val = event.target.value;
		let new_id = `otp_${Number(event.target.id[4]) + 1}`;

		// If not delete, move on to next field
		if (val != '') {
			document.getElementById(new_id)?.focus();
		}
	}

	// for fetching backend using tracking_num query
	let tracking_num = $state(page.url.searchParams.get('tracking_num'));
	let tracking_copy = $state(tracking_num);

	if (tracking_num == null) tracking_num = '';

	const userParcel = $derived(useQuery(api.parcels.getParcel, { tracking_num: tracking_num }));

	let claim_in = 'N/A',
		isClaimPeriodFinished = false,
		days = $derived.by(() => {
			if (userParcel.data != undefined) {
				let claim_by = new Date(userParcel.data.parcel_info.claim_by);
				let today = new Date(Date.now());

				let hrs = Math.floor((claim_by - today) / 3600000);
				let days = Math.floor(hrs / 24);

				// Past claiming deadline already
				if (hrs < 0) {
					isClaimPeriodFinished = true;
					days *= -1;
					hrs *= -1;
				}

				return days;
			}
		});

	// resubmit tracking number (updates url search parameters to match new submission)
	function resubmitTrackingNumber() {
		const params = new URLSearchParams(page.url.searchParams.toString());
		params.set('tracking_num', tracking_num);
		goto(`/tracking/?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	// Initialize the action hook
	const client = useConvexClient();

	// For QR scanning (auth)
	let otpStatus = $state('');
	let isLoading = $state(false);
	const latestScanQuery = $derived(useQuery(api.scanner.getLatestScan, {}));
	let currentScan = $derived(latestScanQuery.data ?? null);
	$inspect(currentScan);

	// Poll Python service in the background to keep Convex DB updated
	let scanInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		scanInterval = setInterval(() => {
			client.action(api.scanner.syncScan, {}).catch((err) => {
				console.error('Failed to sync scan:', err);
			});
		}, 2000);
		return () => clearInterval(scanInterval);
	});

	function isScanExpired(scan) {
		const threeMinutes = 3 * 60 * 1000;
		return Date.now() - scan.scanned_at * 1000 > threeMinutes;
	}

	async function submitOTP() {
		isLoading = true;
		otpStatus = '';

		if (!currentScan) {
			otpStatus = 'Please scan first.';
			isLoading = false;
			return;
		}

		if (isScanExpired(currentScan)) {
			otpStatus = 'Scan expired. Please scan again.';
			isLoading = false;
			return;
		}

		if (userParcel.data?.parcel_info?.recipient_uid !== currentScan!.uin) {
			otpStatus = 'Identity mismatch. This QR code does not match the parcel recipient.';
			isLoading = false;
			await client.action(api.scanner.failedAttempt, {});
			await client.mutation(api.attempts.logAttempt, {
				locker_num: userParcel.data?.locker_num,
				date: Date.now(),
				uin: currentScan!.uin,
				is_successful: false
			});
			return;
		}

		const otp = otpCode.join('');
		if (otp.length !== 6) {
			otpStatus = 'Please enter a 6-digit OTP.';
			isLoading = false;
			return;
		}

		try {
			const result = await client.action(api.scanner.verifyOtp, {
				uin: currentScan!.uin,
				otp: otp,
				transaction_id: currentScan!.transaction_id,
				locker_num: userParcel.data?.locker_num,
				tracking_num: tracking_num!
			});

			console.log('OTP RESULT', result);

			if (result.authStatus) {
				otpStatus = result.status;
			} else {
				otpStatus = result.status;
			}
		} catch (err) {
			console.error(err);
			otpStatus = 'Error: Could not reach the backend.';
		} finally {
			isLoading = false;
		}
	}
</script>

<!-- Main Tracking Panel -->
<div
	class="from-mlb-blue/20 to-mlb-orange/20 flex h-screen flex-col items-center justify-center bg-linear-to-t"
>
	<div
		class="bg-mlb-white relative m-6 flex w-80 flex-col items-center justify-center rounded-xl p-5 drop-shadow-md md:w-1/3"
	>
		<img src={logo} alt="MaiLeBox logo" class="mt-4 max-w-50" />
		<div class="mt-4 flex w-full flex-col p-3">
			{#if userParcel.data == undefined}
				<p class="mb-4 text-center">
					There is no userParcel with tracking number <span class="font-bold">{tracking_copy}</span
					>.
				</p>
				<div class="m-auto flex flex-col place-content-center">
					<p class="w-full py-1 text-left text-lg font-extrabold">Input Tracking Number Again:</p>
					<input
						type="text"
						bind:value={tracking_num}
						class="bg-mlb-gray/50 text-mlb-black mt-2 rounded-3xl px-2 py-1.5 text-center font-bold"
						oninput={resubmitTrackingNumber}
					/>
				</div>
			{:else}
				<p class="py-1 text-left text-sm font-extrabold">Tracking Number</p>
				<p class="bg-mlb-gray/50 text-mlb-black mt-2 rounded-3xl px-2 py-1.5 text-center font-bold">
					{tracking_num}
				</p>
			{/if}
		</div>

		{#if userParcel.isLoading}
			Loading...
		{:else if userParcel.error}
			<p>failed to load: {userParcel.error.toString()}</p>
		{:else if userParcel.data != undefined}
			<div class="grid w-full grid-cols-3 gap-2 gap-x-2 p-3">
				<div class="text-sm font-bold">Status:</div>
				<div class="col-span-2 text-sm">{userParcel.data.parcel_info.status}</div>

				{#if userParcel.data.parcel_info.status == 'In Locker'}
					<div class="text-sm font-bold">Parcel at:</div>
					<div class="col-span-2 text-sm underline">#{userParcel.data.locker_num}</div>

					<div class="text-sm font-bold">Claim in:</div>
					<div class="col-span-2 text-sm">
						{#if isClaimPeriodFinished}
							<span class="text-mlb-red">{days} days past claiming deadline</span>
						{:else}
							{days} days
						{/if}
					</div>
				{/if}
			</div>

			<div class="py-2 md:w-4/5">
				<!-- <p class="italic"> status tba </p> -->
				<StatusBar stat={userParcel.data.parcel_info.status} />
			</div>
			<button
				onclick={() => (detailsOpen = true)}
				class="bg-mlb-orange/80 hover:bg-mlb-orange my-2 w-1/3 rounded-full p-1"
				aria-label="status dropdown"
			>
			</button>

			{#if detailsOpen}
				<StatusDetails
					stat={userParcel.data.parcel_info.status}
					deliveredBy={userParcel.data.parcel_info.delivered_by}
					inLockerBy={userParcel.data.parcel_info.in_locker_by}
					claimedBy={userParcel.data.parcel_info.claim_date}
					onClose={handleClose}
				/>
			{/if}

			{#if userParcel.data.parcel_info.status == 'In Locker'}
				<button
					class="bg-mlb-orange text-mlb-white m-3 rounded-2xl px-4 py-1.5 text-sm font-medium drop-shadow-sm hover:brightness-90"
					onclick={() => {
						isActive = true;
					}}
				>
					Unlock
				</button>
			{/if}
		{/if}
	</div>
</div>

<!-- OTP Modal -->
{#snippet modal_content()}
	<div class="flex flex-col place-content-center items-center justify-center text-center">
		<h1 class="text-mlb-orange mb-4 text-4xl font-bold">
			Unlock Locker {userParcel.data?.locker_num}
		</h1>

		<h2 class="text-mlb-black my-4 text-xl font-bold">Enter OTP Code below:</h2>
		<div id="otp_code" class="my-4 flex min-w-0 shrink gap-x-2">
			{#each otpCode, i (i)}
				<input
					id="otp_{i}"
					type="text"
					inputmode="numeric"
					maxlength="1"
					class="bg-mlb-gray w-10 rounded-xl p-4 text-center font-bold md:w-12"
					bind:value={otpCode[i]}
					oninput={autoFocus}
				/>
			{/each}
		</div>

		<button
			class="bg-mlb-orange text-mlb-white text-l m-3 rounded-2xl px-7 py-3 font-medium drop-shadow-sm hover:brightness-90"
			onclick={submitOTP}
			disabled={isLoading}
		>
			{isLoading ? 'Processing...' : 'Unlock'}
		</button>
		<p>{otpStatus}</p>
	</div>
{/snippet}

{#if isActive}
	<Modal {modal_content} bind:active={isActive} />
{/if}
