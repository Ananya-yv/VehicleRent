<script lang="ts">
	import { page } from '$app/state';
	import { Sidebar, Header, Breadcrumbs } from '$lib/components/ui';
	import type { UserRole } from '$lib/database.types';
	import type { Snippet } from 'svelte';

	interface UserProfile {
		name: string;
		email: string;
		role: UserRole;
	}

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		user?: UserProfile | null;
		role?: UserRole | 'customer';
		breadcrumbs?: BreadcrumbItem[];
		title?: string;
		children: Snippet;
		actions?: Snippet;
	}

	let { user, role = 'customer', breadcrumbs = [], title, children, actions }: Props = $props();

	let sidebarOpen = $state(false);

	const homeHref = $derived.by(() => {
		switch (role) {
			case 'admin':
				return '/admin/dashboard';
			case 'delivery':
				return '/agent/dashboard';
			case 'helpline':
				return '/help/dashboard';
			default:
				return '/';
		}
	});
</script>

<div class="flex min-h-screen bg-gray-100">
	<Sidebar
		{role}
		currentPath={page.url.pathname}
		isOpen={sidebarOpen}
		onClose={() => (sidebarOpen = false)}
	/>

	<div class="flex flex-1 flex-col lg:ml-64">
		<Header {user} onMenuClick={() => (sidebarOpen = !sidebarOpen)} />

		<main class="flex-1 p-4 lg:p-6">
			{#if breadcrumbs.length > 0}
				<Breadcrumbs items={breadcrumbs} {homeHref} />
			{/if}

			{#if title || actions}
				<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					{#if title}
						<h1 class="text-2xl font-bold text-gray-900">{title}</h1>
					{/if}
					{#if actions}
						<div class="flex gap-2">
							{@render actions()}
						</div>
					{/if}
				</div>
			{/if}

			{@render children()}
		</main>
	</div>
</div>
