<script lang="ts" generics="T">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Column<T> {
		key: keyof T | string;
		label: string;
		sortable?: boolean;
		render?: (item: T) => string;
	}

	interface Props {
		data: T[];
		columns: Column<T>[];
		row?: Snippet<[T, number]>;
		emptyMessage?: string;
		loading?: boolean;
		currentPage?: number;
		totalPages?: number;
		onPageChange?: (page: number) => void;
	}

	let {
		data,
		columns,
		row,
		emptyMessage = 'No data available',
		loading = false,
		currentPage = 1,
		totalPages = 1,
		onPageChange
	}: Props = $props();

	function getValue(item: T, key: string): string {
		const keys = key.split('.');
		let value: unknown = item;
		for (const k of keys) {
			value = (value as Record<string, unknown>)?.[k];
		}
		return String(value ?? '-');
	}
</script>

<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
	<div class="overflow-x-auto">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					{#each columns as column}
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							{column.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#if loading}
					<tr>
						<td colspan={columns.length} class="px-6 py-12 text-center">
							<div class="flex items-center justify-center">
								<svg class="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
							</div>
						</td>
					</tr>
				{:else if data.length === 0}
					<tr>
						<td colspan={columns.length} class="px-6 py-12 text-center text-gray-500">
							{emptyMessage}
						</td>
					</tr>
				{:else}
					{#each data as item, index}
						{#if row}
							{@render row(item, index)}
						{:else}
							<tr class="hover:bg-gray-50">
								{#each columns as column}
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
										{#if column.render}
											{column.render(item)}
										{:else}
											{getValue(item, String(column.key))}
										{/if}
									</td>
								{/each}
							</tr>
						{/if}
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if totalPages > 1 && onPageChange}
		<div class="flex items-center justify-between border-t bg-gray-50 px-6 py-3">
			<p class="text-sm text-gray-600">
				Page {currentPage} of {totalPages}
			</p>
			<div class="flex gap-2">
				<button
					onclick={() => onPageChange(currentPage - 1)}
					disabled={currentPage <= 1}
					class="rounded-lg border bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				<button
					onclick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
					class="rounded-lg border bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}
</div>
