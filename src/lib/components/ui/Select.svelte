<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Option {
		value: string;
		label: string;
	}

	interface Props extends Omit<HTMLSelectAttributes, 'value'> {
		label?: string;
		error?: string;
		options: Option[];
		placeholder?: string;
		value?: string;
	}

	let { label, error, options, placeholder, id, value = $bindable(''), ...rest }: Props = $props();
	const selectId = id || `select-${Math.random().toString(36).slice(2)}`;
</script>

<div class="space-y-1">
	{#if label}
		<label for={selectId} class="block text-sm font-medium text-gray-700">
			{label}
			{#if rest.required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}
	<select
		id={selectId}
		bind:value
		class="block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 {error
			? 'border-red-300 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} disabled:cursor-not-allowed disabled:bg-gray-50"
		{...rest}
	>
		{#if placeholder}
			<option value="" disabled selected>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>
