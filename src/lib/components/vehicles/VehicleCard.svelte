<script lang="ts">
	import { Badge, Button } from '$lib/components/ui';
	import type { AvailabilityStatus, RentType } from '$lib/database.types';

	interface Vehicle {
		id: string;
		model: string;
		type: string;
		rent_type: RentType;
		rent_price: number;
		condition: string | null;
		availability_status: AvailabilityStatus;
	}

	interface Props {
		vehicle: Vehicle;
		onBook?: (vehicle: Vehicle) => void;
	}

	let { vehicle, onBook }: Props = $props();

	const statusColors: Record<AvailabilityStatus, 'success' | 'warning' | 'error'> = {
		available: 'success',
		booked: 'warning',
		maintenance: 'error'
	};

	const rentTypeLabel = {
		daily: 'per day',
		hourly: 'per hour'
	};
</script>

<div class="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
	<div class="p-4">
		<div class="mb-2 flex items-start justify-between">
			<div>
				<h3 class="font-semibold text-gray-900">{vehicle.model}</h3>
				<p class="text-sm text-gray-500">{vehicle.type}</p>
			</div>
			<div class="text-right">
				<p class="text-lg font-bold text-blue-600">₹{vehicle.rent_price}</p>
				<p class="text-xs text-gray-500">{rentTypeLabel[vehicle.rent_type]}</p>
			</div>
		</div>

		{#if vehicle.condition}
			<p class="mb-3 text-sm text-gray-600">
				<span class="font-medium">Condition:</span> {vehicle.condition}
			</p>
		{/if}

		<div class="flex items-center gap-2 mb-2 text-xs text-gray-500">
			<p>
				<span class="font-medium">Status:</span>
				<Badge variant={statusColors[vehicle.availability_status]}>
					{vehicle.availability_status}
				</Badge>
			</p>
		</div>

		{#if vehicle.availability_status === 'available' && onBook}
			<Button
				variant="primary"
				class="mt-4 w-full"
				onclick={() => onBook(vehicle)}
			>
				Book Now
			</Button>
		{:else if vehicle.availability_status !== 'available'}
			<Button variant="secondary" class="mt-4 w-full" disabled>
				{vehicle.availability_status === 'booked' ? 'Currently Booked' : 'Under Maintenance'}
			</Button>
		{/if}
	</div>
</div>
