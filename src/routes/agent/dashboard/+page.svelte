<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { StatsCard, Badge, Button } from '$lib/components/ui';
	import { Truck, Package, CheckCircle, Clock, MapPin, Phone, Calendar, ArrowRight } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { BookingStatus } from '$lib/database.types';

	let { data }: { data: PageData } = $props();

	const stats = [
		{ title: 'Pending Deliveries', value: 3, icon: Package, color: 'yellow' as const },
		{ title: 'Completed Today', value: 5, icon: CheckCircle, color: 'green' as const },
		{ title: 'Total Assigned', value: 12, icon: Truck, color: 'blue' as const }
	];

	interface AssignedBooking {
		id: string;
		customer_name: string;
		phone: string;
		vehicle_model: string;
		status: BookingStatus;
		delivery_location: string;
		start_date: string;
		end_date: string;
		otp_code: string;
	}

	let assignedBookings = $state<AssignedBooking[]>([
		{ id: '1', customer_name: 'John Doe', phone: '+91 98765 43210', vehicle_model: 'Toyota Camry', status: 'confirmed', delivery_location: '123 Main Street, Mumbai', start_date: '2024-01-15T10:00', end_date: '2024-01-18T10:00', otp_code: '123456' },
		{ id: '2', customer_name: 'Jane Smith', phone: '+91 98765 43211', vehicle_model: 'Honda City', status: 'confirmed', delivery_location: '456 Park Avenue, Pune', start_date: '2024-01-15T14:00', end_date: '2024-01-17T14:00', otp_code: '789012' },
		{ id: '3', customer_name: 'Mike Wilson', phone: '+91 98765 43212', vehicle_model: 'Mahindra Thar', status: 'delivered', delivery_location: '789 Oak Lane, Delhi', start_date: '2024-01-14T09:00', end_date: '2024-01-16T09:00', otp_code: '345678' }
	]);

	const statusColors: Record<BookingStatus, 'success' | 'warning' | 'info' | 'error'> = {
		pending: 'warning',
		confirmed: 'info',
		delivered: 'success',
		returned: 'success',
		cancelled: 'error'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
	}

	const pendingDeliveries = $derived(assignedBookings.filter(b => b.status === 'confirmed'));
	const activeDeliveries = $derived(assignedBookings.filter(b => b.status === 'delivered'));
</script>

<svelte:head>
	<title>Delivery Agent Dashboard - Vehicle Rental</title>
</svelte:head>

<DashboardLayout
	role="delivery"
	user={data.userProfile}
	title="My Dashboard"
>
	<div class="grid gap-6 md:grid-cols-3">
		{#each stats as stat}
			<StatsCard
				title={stat.title}
				value={stat.value}
				icon={stat.icon}
				color={stat.color}
			/>
		{/each}
	</div>

	<div class="mt-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">Pending Deliveries</h2>
			<a href="/agent/deliveries" class="text-sm text-blue-600 hover:text-blue-700">View all →</a>
		</div>

		{#if pendingDeliveries.length === 0}
			<div class="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
				<CheckCircle class="mx-auto h-12 w-12 text-green-500" />
				<p class="mt-4 font-medium text-gray-900">All caught up!</p>
				<p class="text-sm text-gray-500">No pending deliveries at the moment.</p>
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each pendingDeliveries as booking}
					<div class="rounded-xl border bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-start justify-between">
							<div>
								<h3 class="font-semibold text-gray-900">{booking.customer_name}</h3>
								<p class="text-sm text-gray-500">{booking.vehicle_model}</p>
							</div>
							<Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
						</div>

						<div class="space-y-2 text-sm">
							<div class="flex items-center gap-2 text-gray-600">
								<Phone class="h-4 w-4" />
								<a href="tel:{booking.phone}" class="hover:text-blue-600">{booking.phone}</a>
							</div>
							<div class="flex items-start gap-2 text-gray-600">
								<MapPin class="mt-0.5 h-4 w-4 shrink-0" />
								<span>{booking.delivery_location}</span>
							</div>
							<div class="flex items-center gap-2 text-gray-600">
								<Calendar class="h-4 w-4" />
								<span>{formatDate(booking.start_date)}</span>
							</div>
						</div>

						<div class="mt-4 rounded-lg bg-yellow-50 p-3 text-center">
							<p class="text-xs text-yellow-700">Verification OTP</p>
							<p class="text-lg font-bold tracking-widest text-yellow-900">{booking.otp_code}</p>
						</div>

						<a href="/agent/deliveries/{booking.id}">
							<Button variant="primary" class="mt-4 w-full">
								Start Delivery
								<ArrowRight class="h-4 w-4" />
							</Button>
						</a>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="mt-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">Active Rentals (Awaiting Pickup)</h2>
		</div>

		{#if activeDeliveries.length === 0}
			<div class="rounded-xl border bg-white p-6 text-center text-gray-500">
				No active rentals awaiting pickup.
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
				<table class="w-full">
					<thead class="bg-gray-50">
						<tr class="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							<th class="px-6 py-3">Customer</th>
							<th class="px-6 py-3">Vehicle</th>
							<th class="px-6 py-3">End Date</th>
							<th class="px-6 py-3">Location</th>
							<th class="px-6 py-3">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each activeDeliveries as booking}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4">
									<p class="font-medium text-gray-900">{booking.customer_name}</p>
									<p class="text-sm text-gray-500">{booking.phone}</p>
								</td>
								<td class="px-6 py-4 text-gray-600">{booking.vehicle_model}</td>
								<td class="px-6 py-4 text-sm text-gray-600">{formatDate(booking.end_date)}</td>
								<td class="px-6 py-4 text-sm text-gray-600">{booking.delivery_location}</td>
								<td class="px-6 py-4">
									<Button variant="outline" size="sm">Schedule Pickup</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</DashboardLayout>
