<script lang="ts">
	import {
		Home,
		Car,
		Calendar,
		Users,
		CreditCard,
		MessageSquare,
		Truck,
		ClipboardList,
		Phone,
		ChevronDown,
		X,
		type Icon
	} from 'lucide-svelte';
	import type { UserRole } from '$lib/database.types';
	import type { ComponentType } from 'svelte';

	interface NavItem {
		label: string;
		href: string;
		icon: ComponentType<Icon>;
		children?: { label: string; href: string }[];
	}

	interface Props {
		role: UserRole | 'customer';
		currentPath: string;
		isOpen?: boolean;
		onClose?: () => void;
	}

	let { role, currentPath, isOpen = true, onClose }: Props = $props();

	let expandedMenus = $state<Set<string>>(new Set());

	const customerNav: NavItem[] = [
		{ label: 'Home', href: '/', icon: Home },
		{ label: 'Vehicles', href: '/vehicles', icon: Car },
		{ label: 'My Bookings', href: '/bookings/track', icon: Calendar }
	];

	const adminNav: NavItem[] = [
		{ label: 'Dashboard', href: '/admin/dashboard', icon: Home },
		{
			label: 'Vehicles',
			href: '/admin/vehicles',
			icon: Car,
			children: [
				{ label: 'All Vehicles', href: '/admin/vehicles' },
				{ label: 'Add Vehicle', href: '/admin/vehicles/new' }
			]
		},
		{
			label: 'Bookings',
			href: '/admin/bookings',
			icon: Calendar,
			children: [
				{ label: 'All Bookings', href: '/admin/bookings' },
				{ label: 'Pending', href: '/admin/bookings?status=pending' },
				{ label: 'Active', href: '/admin/bookings?status=confirmed' }
			]
		},
		{ label: 'Users', href: '/admin/users', icon: Users },
		{ label: 'Transactions', href: '/admin/transactions', icon: CreditCard },
		{ label: 'Complaints', href: '/admin/complaints', icon: MessageSquare }
	];

	const deliveryNav: NavItem[] = [
		{ label: 'Dashboard', href: '/agent/dashboard', icon: Home },
		{ label: 'My Deliveries', href: '/agent/deliveries', icon: Truck },
		{ label: 'Delivery Logs', href: '/agent/logs', icon: ClipboardList }
	];

	const helplineNav: NavItem[] = [
		{ label: 'Dashboard', href: '/help/dashboard', icon: Home },
		{ label: 'All Complaints', href: '/help/complaints', icon: MessageSquare },
		{ label: 'My Assigned', href: '/help/complaints?filter=mine', icon: ClipboardList }
	];

	const navItems = $derived.by(() => {
		switch (role) {
			case 'admin':
				return adminNav;
			case 'delivery':
				return deliveryNav;
			case 'helpline':
				return helplineNav;
			default:
				return customerNav;
		}
	});

	const roleLabel = $derived.by(() => {
		switch (role) {
			case 'admin':
				return 'Admin Portal';
			case 'delivery':
				return 'Delivery Agent';
			case 'helpline':
				return 'Helpline Agent';
			default:
				return 'Vehicle Rental';
		}
	});

	function toggleMenu(label: string) {
		if (expandedMenus.has(label)) {
			expandedMenus.delete(label);
		} else {
			expandedMenus.add(label);
		}
		expandedMenus = new Set(expandedMenus);
	}

	function isActive(href: string): boolean {
		if (href === '/' || href === '/admin/dashboard' || href === '/agent/dashboard' || href === '/help/dashboard') {
			return currentPath === href;
		}
		return currentPath.startsWith(href.split('?')[0]);
	}
</script>

<aside
	class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-white transition-transform duration-300 lg:translate-x-0 {isOpen ? 'translate-x-0' : '-translate-x-full'}"
>
	<div class="flex h-16 items-center justify-between border-b border-gray-800 px-4">
		<div class="flex items-center gap-2">
			<Car class="h-8 w-8 text-blue-500" />
			<span class="text-lg font-bold">{roleLabel}</span>
		</div>
		<button onclick={onClose} class="rounded p-1 hover:bg-gray-800 lg:hidden">
			<X class="h-5 w-5" />
		</button>
	</div>

	<nav class="flex-1 overflow-y-auto p-4">
		<ul class="space-y-1">
			{#each navItems as item}
				<li>
					{#if item.children}
						<button
							onclick={() => toggleMenu(item.label)}
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-800 hover:text-white {isActive(item.href) ? 'bg-gray-800 text-white' : ''}"
						>
							<span class="flex items-center gap-3">
								<item.icon class="h-5 w-5" />
								{item.label}
							</span>
							<ChevronDown
								class="h-4 w-4 transition-transform {expandedMenus.has(item.label) ? 'rotate-180' : ''}"
							/>
						</button>
						{#if expandedMenus.has(item.label)}
							<ul class="ml-8 mt-1 space-y-1">
								{#each item.children as child}
									<li>
										<a
											href={child.href}
											class="block rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white {currentPath === child.href ? 'bg-gray-800 text-white' : ''}"
										>
											{child.label}
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					{:else}
						<a
							href={item.href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white {isActive(item.href) ? 'bg-gray-800 text-white' : ''}"
						>
							<item.icon class="h-5 w-5" />
							{item.label}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>

	<div class="border-t border-gray-800 p-4">
		<p class="text-xs text-gray-500">© 2024 Vehicle Rental</p>
	</div>
</aside>

{#if isOpen}
	<div
		class="fixed inset-0 z-40 bg-black/50 lg:hidden"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose?.()}
		role="button"
		tabindex="0"
	></div>
{/if}
