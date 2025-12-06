<script lang="ts">
	import { ChevronRight, Home } from 'lucide-svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		items: BreadcrumbItem[];
		homeHref?: string;
	}

	let { items, homeHref = '/' }: Props = $props();
</script>

<nav aria-label="Breadcrumb" class="mb-4">
	<ol class="flex items-center space-x-2 text-sm">
		<li>
			<a
				href={homeHref}
				class="flex items-center text-gray-500 hover:text-gray-700"
			>
				<Home class="h-4 w-4" />
			</a>
		</li>
		{#each items as item, index}
			<li class="flex items-center">
				<ChevronRight class="h-4 w-4 text-gray-400" />
				{#if item.href && index < items.length - 1}
					<a href={item.href} class="ml-2 text-gray-500 hover:text-gray-700">
						{item.label}
					</a>
				{:else}
					<span class="ml-2 font-medium text-gray-900">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
