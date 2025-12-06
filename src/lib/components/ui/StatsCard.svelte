<script lang="ts">
	import type { ComponentType } from 'svelte';
	import type { Icon } from 'lucide-svelte';

	interface Props {
		title: string;
		value: string | number;
		icon: ComponentType<Icon>;
		trend?: {
			value: number;
			isPositive: boolean;
		};
		color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
	}

	let { title, value, icon: IconComponent, trend, color = 'blue' }: Props = $props();

	const colorClasses = {
		blue: 'bg-blue-50 text-blue-600',
		green: 'bg-green-50 text-green-600',
		yellow: 'bg-yellow-50 text-yellow-600',
		red: 'bg-red-50 text-red-600',
		purple: 'bg-purple-50 text-purple-600',
		gray: 'bg-gray-50 text-gray-600'
	};
</script>

<div class="rounded-xl border bg-white p-6 shadow-sm">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-sm font-medium text-gray-500">{title}</p>
			<p class="mt-2 text-3xl font-bold text-gray-900">{value}</p>
			{#if trend}
				<p class="mt-1 flex items-center text-sm {trend.isPositive ? 'text-green-600' : 'text-red-600'}">
					<span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
					<span class="ml-1 text-gray-500">vs last month</span>
				</p>
			{/if}
		</div>
		<div class="rounded-lg p-3 {colorClasses[color]}">
			<IconComponent class="h-6 w-6" />
		</div>
	</div>
</div>
