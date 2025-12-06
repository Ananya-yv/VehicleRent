<script lang="ts">
	import { Menu, Bell, User, LogOut, ChevronDown, Settings } from 'lucide-svelte';
	import type { UserRole } from '$lib/database.types';

	interface UserProfile {
		name: string;
		email: string;
		role: UserRole;
	}

	interface Props {
		user?: UserProfile | null;
		onMenuClick: () => void;
	}

	let { user, onMenuClick }: Props = $props();
	let showUserMenu = $state(false);

	function getRoleBadgeColor(role: UserRole): string {
		switch (role) {
			case 'admin':
				return 'bg-purple-100 text-purple-800';
			case 'delivery':
				return 'bg-blue-100 text-blue-800';
			case 'helpline':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getRoleLabel(role: UserRole): string {
		switch (role) {
			case 'admin':
				return 'Admin';
			case 'delivery':
				return 'Delivery Agent';
			case 'helpline':
				return 'Helpline Agent';
			default:
				return role;
		}
	}
</script>

<header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
	<div class="flex items-center gap-4">
		<button
			onclick={onMenuClick}
			class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
			aria-label="Toggle menu"
		>
			<Menu class="h-6 w-6" />
		</button>
	</div>

	<div class="flex items-center gap-4">
		{#if user}
			<button class="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100">
				<Bell class="h-5 w-5" />
				<span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
			</button>

			<div class="relative">
				<button
					onclick={() => (showUserMenu = !showUserMenu)}
					class="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100"
				>
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
						<User class="h-5 w-5 text-gray-600" />
					</div>
					<div class="hidden text-left md:block">
						<p class="text-sm font-medium text-gray-900">{user.name}</p>
						<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {getRoleBadgeColor(user.role)}">
							{getRoleLabel(user.role)}
						</span>
					</div>
					<ChevronDown class="hidden h-4 w-4 text-gray-600 md:block" />
				</button>

				{#if showUserMenu}
					<div class="absolute right-0 mt-2 w-56 rounded-lg border bg-white py-2 shadow-lg">
						<div class="border-b px-4 py-2 md:hidden">
							<p class="font-medium text-gray-900">{user.name}</p>
							<p class="text-sm text-gray-500">{user.email}</p>
						</div>
						<a
							href="/profile"
							class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							<User class="h-4 w-4" />
							Profile
						</a>
						<a
							href="/settings"
							class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							<Settings class="h-4 w-4" />
							Settings
						</a>
						<hr class="my-2" />
						<form action="/api/auth/signout" method="POST">
							<button
								type="submit"
								class="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
							>
								<LogOut class="h-4 w-4" />
								Sign Out
							</button>
						</form>
					</div>
				{/if}
			</div>
		{:else}
			<a
				href="/sign-in"
				class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
			>
				Sign In
			</a>
		{/if}
	</div>
</header>

<svelte:window
	onclick={(e) => {
		if (showUserMenu && !(e.target as HTMLElement).closest('.relative')) {
			showUserMenu = false;
		}
	}}
/>
