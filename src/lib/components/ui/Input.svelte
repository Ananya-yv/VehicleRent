<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label?: string;
		error?: string;
		hint?: string;
		value?: string | number;
	}

	let { label, error, hint, id, value = $bindable(''), ...rest }: Props = $props();
	const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
</script>

<div class="space-y-1">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-gray-700">
			{label}
			{#if rest.required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}
	<input
		id={inputId}
		bind:value
		class="block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 {error
			? 'border-red-300 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
		{...rest}
	/>
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{:else if hint}
		<p class="text-sm text-gray-500">{hint}</p>
	{/if}
</div>
