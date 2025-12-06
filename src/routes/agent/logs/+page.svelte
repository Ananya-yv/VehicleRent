<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { Badge, Select } from '$lib/components/ui';
	import { ClipboardList, Truck, Package, Calendar } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { DeliveryAction } from '$lib/database.types';

	let { data }: { data: PageData } = $props();

	interface DeliveryLog {
		id: string;
		booking_id: string;
		customer_name: string;
		vehicle_model: string;
		action: DeliveryAction;
		action_time: string;
		notes: string | null;
	}

	let logs = $state<DeliveryLog[]>([
		{ id: '1', booking_id: 'B001', customer_name: 'John Doe', vehicle_model: 'Toyota Camry', action: 'delivered', action_time: '2024-01-15T10:30:00Z', notes: 'Delivered on time' },
		{ id: '2', booking_id: 'B001', customer_name: 'John Doe', vehicle_model: 'Toyota Camry', action: 'picked_up', action_time: '2024-01-18T10:15:00Z', notes: 'Vehicle in good condition' },
		{ id: '3', booking_id: 'B002', customer_name: 'Jane Smith', vehicle_model: 'Honda City', action: 'delivered', action_time: '2024-01-14T14:45:00Z', notes: null },
		{ id: '4', booking_id: 'B003', customer_name: 'Mike Wilson', vehicle_model: 'Mahindra Thar', action: 'delivered', action_time: '2024-01-14T09:20:00Z', notes: 'Customer requested early delivery' }
	]);

	let actionFilter = $state('');

	const filteredLogs = $derived(
		logs.filter(l => !actionFilter || l.action === actionFilter)
	);

	const actionColors: Record<DeliveryAction, 'success' | 'info'> = {
		delivered: 'info',
		picked_up: 'success'
	};

	const actionLabels: Record<DeliveryAction, string> = {
		delivered: 'Delivered',
		picked_up: 'Picked Up'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-IN', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>Delivery Logs - Delivery Agent</title>
</svelte:head>

<DashboardLayout
	role="delivery"
	user={data.userProfile}
	title="Delivery Logs"
	breadcrumbs={[{ label: 'Logs' }]}
>
	<div class="mb-6 flex items-center gap-4">
		<Select
			options={[
				{ value: '', label: 'All Actions' },
				{ value: 'delivered', label: 'Deliveries' },
				{ value: 'picked_up', label: 'Pickups' }
			]}
			bind:value={actionFilter}
		/>
	</div>

	<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr class="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
						<th class="px-6 py-3">Date & Time</th>
						<th class="px-6 py-3">Customer</th>
						<th class="px-6 py-3">Vehicle</th>
						<th class="px-6 py-3">Action</th>
						<th class="px-6 py-3">Notes</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each filteredLogs as log}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 text-sm text-gray-600">
								<div class="flex items-center gap-2">
									<Calendar class="h-4 w-4 text-gray-400" />
									{formatDate(log.action_time)}
								</div>
							</td>
							<td class="px-6 py-4">
								<p class="font-medium text-gray-900">{log.customer_name}</p>
								<p class="text-sm text-gray-500">Booking: {log.booking_id}</p>
							</td>
							<td class="px-6 py-4 text-gray-600">{log.vehicle_model}</td>
							<td class="px-6 py-4">
								<Badge variant={actionColors[log.action]}>
									{#if log.action === 'delivered'}
										<Package class="mr-1 h-3 w-3" />
									{:else}
										<Truck class="mr-1 h-3 w-3" />
									{/if}
									{actionLabels[log.action]}
								</Badge>
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{log.notes || '-'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if filteredLogs.length === 0}
			<div class="p-12 text-center">
				<ClipboardList class="mx-auto h-12 w-12 text-gray-400" />
				<p class="mt-4 text-gray-500">No delivery logs found</p>
			</div>
		{/if}
	</div>
</DashboardLayout>
