<script>
	import dashboard from '$lib/assets/icons/dashboard_dark.svg';
	import list from '$lib/assets/icons/list_dark.svg';
	import logo from '$lib/assets/mlb_logo.png';
	import locker from '$lib/assets/icons/locker_dark.svg';
	import menu from '$lib/assets/icons/menu.svg';

	import { resolve } from '$app/paths';
	// import { page } from '$app/state';

	// let currentPage = $state(page.url.pathname);

	let menus = $state([
		{ label: 'Dashboard', icon: dashboard, icon_alt: 'Admin Dashboard', url: '/' },
		{ label: 'Logs', icon: list, icon_alt: 'Admin Logs', url: 'logs' },
		{ label: 'Mailboxes', icon: locker, icon_alt: 'Locker', url: 'mailboxes' },
		{ label: 'Attempts', icon: list, icon_alt: 'Admin Attempts', url: 'attempts'}
	]);

	let { active = $bindable() } = $props();

	function toggleNavBar() {
		active = !active;
	}
</script>

<div class="bg-mlb-white flex h-screen w-1/5 flex-col duration-300 {active ? 'block' : 'hidden'}">
	<div class="mt-12 mb-8 w-full">
		<img src={logo} alt="Mailebox Logo" class="m-auto flex max-w-40" />
	</div>

	{#each menus as menu (menu.label)}
		<div class="my-1 w-full">
			<button
				class="hover:bg-mlb-orange/25 m-auto flex w-3/4 place-content-center items-center rounded-full px-8 py-2"
			>
				<div class="mr-2 flex w-1/4">
					<img src={menu.icon} alt={menu.icon_alt} class="max-w-8" />
				</div>
				<a
					href={resolve(`/admin/${menu.url}`)}
					class="text-mlb-black text-l w-3/4 text-left align-middle font-bold">{menu.label}</a
				>
			</button>
		</div>
	{/each}
</div>

<!-- Collapse Button -->
<button
	class="absolute bottom-5 z-5 rounded-full p-2 {active
		? 'left-82'
		: 'left-5'} bg-mlb-orange/90 shadow-md hover:brightness-90"
	onclick={toggleNavBar}
>
	<img src={menu} alt="Collapse or Open Navbar" class="max-w-7" />
</button>
