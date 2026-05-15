<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import TableRow from '$lib/components/table_row_unsuccessful_logs.svelte';
	import PieChart from '$lib/components/pie_chart.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import { onMount } from 'svelte';

	type Parcel = {
    status: string;
    in_locker_by: string;
    claim_by: string;
	};
	
	const parcels = useQuery(api.parcels.getParcels, {});
	const mailboxes = useQuery(api.mailboxes.getMailboxes, {});
	const logs = useQuery(api.attempts.getAttempts,{});

	const notinUseMailbox = $derived(mailboxes.data?.filter((p) => p.status === 'Available') ?? []);
	const InUseMailbox = $derived(mailboxes.data?.filter((p) => p.status === 'Unavailable') ?? []);
	const inUseParcel = $derived(parcels.data?.filter((p) => p.status === 'In Locker' || p.status === 'Sorting') ?? []);
	const FailedAttempts = $derived(logs.data?.filter((p) => p.is_successful === false) ?? []);

	const expiredParcel = $derived(
		inUseParcel.filter((p) => p.claim_by < Date.now())
	);
	console.log(expiredParcel, "EXPIRED PARCEL COUNTS");
	
	const validParcel = $derived.by(() => {
		return inUseParcel.filter((p) => {
			
			const date_deli = new Date(p.in_locker_by);
			const date_claim = new Date(p.claim_by);
			return Math.floor((date_claim.getTime() - date_deli.getTime())) >= 0; 
		});
	});

	const totalMailboxes = $derived(mailboxes.data?.length ?? 0);

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
						<p> {notinUseMailbox.length} </p>
					</div>

					<div class="p-2 w-1/2 bg-red-100 rounded-lg">
						<p class="font-medium"> Overdue Parcels </p>
						<p> {expiredParcel.length} </p>
					</div>
				</div>

				{#if parcels.isLoading || mailboxes.isLoading || logs.isLoading}
					<p>loading...</p>
				{:else if parcels.error || mailboxes.error || logs.error}
					<p>error</p>
				{:else}
					<PieChart percent_avail={notinUseMailbox.length/totalMailboxes * 100} percent_occ={(InUseMailbox.length-expiredParcel.length)/totalMailboxes * 100} percent_over={expiredParcel.length/totalMailboxes * 100}/>
				{/if}
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
					<div class="p-2 flex flex-col w-full text-center">
						{#each FailedAttempts as attempt (attempt)}
							<TableRow locker_num={attempt.locker_number} attempt_date={attempt.attempt_date} scanner_uin={attempt.uin}/>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
