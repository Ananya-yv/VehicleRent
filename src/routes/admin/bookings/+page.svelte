<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { Button, Badge, Modal, Select, Input } from '$lib/components/ui';
	import { Eye, UserPlus, Search, Filter } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { PageData } from './$types';
	import type { BookingStatus } from '$lib/database.types';

	let { data }: { data: PageData } = $props();

	interface Booking {
		id: string;
		customer_name: string;
		phone: string;
		email: string;
		vehicle_model: string;
		status: BookingStatus;
		start_date: string;
		end_date: string;
		advance_amount: number;
		delivery_location: string;
		assigned_agent?: string;
	}

	let bookings = $state<Booking[]>([
		{ id: '1', customer_name: 'John Doe', phone: '+91 98765 43210', email: 'john@example.com', vehicle_model: 'Toyota Camry', status: 'pending', start_date: '2024-01-15T10:00', end_date: '2024-01-18T10:00', advance_amount: 500, delivery_location: 'Mumbai', assigned_agent: undefined },
		{ id: '2', customer_name: 'Jane Smith', phone: '+91 98765 43211', email: 'jane@example.com', vehicle_model: 'Honda City', status: 'confirmed', start_date: '2024-01-14T09:00', end_date: '2024-01-16T09:00', advance_amount: 360, delivery_location: 'Pune', assigned_agent: 'Raj Kumar' },
		{ id: '3', customer_name: 'Mike Wilson', phone: '+91 98765 43212', email: 'mike@example.com', vehicle_model: 'Mahindra Thar', status: 'delivered', start_date: '2024-01-13T08:00', end_date: '2024-01-15T08:00', advance_amount: 700, delivery_location: 'Delhi', assigned_agent: 'Amit Singh' },
		{ id: '4', customer_name: 'Sarah Brown', phone: '+91 98765 43213', email: 'sarah@example.com', vehicle_model: 'Hyundai Creta', status: 'returned', start_date: '2024-01-12T11:00', end_date: '2024-01-14T11:00', advance_amount: 560, delivery_location: 'Bangalore', assigned_agent: 'Raj Kumar' }
	]);

	let deliveryAgents = $state([
		{ id: '1', name: 'Raj Kumar' },
		{ id: '2', name: 'Amit Singh' },
		{ id: '3', name: 'Priya Sharma' }
	]);

	let selectedBooking = $state<Booking | null>(null);
	let showAssignModal = $state(false);
	let showDetailsModal = $state(false);
	let selectedAgent = $state('');
	let searchQuery = $state('');
	let statusFilter = $state('');

	const statusColors: Record<BookingStatus, 'success' | 'warning' | 'error' | 'info'> = {
		pending: 'warning',
		confirmed: 'info',
		delivered: 'success',
		returned: 'success',
		cancelled: 'error'
	};

	const filteredBookings = $derived(
		bookings.filter(b => {
			const matchesSearch = b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.vehicle_model.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = !statusFilter || b.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);

	function openAssignModal(booking: Booking) {
		selectedBooking = booking;
		selectedAgent = booking.assigned_agent || '';
		showAssignModal = true;
	}

	function handleAssign() {
		if (selectedBooking && selectedAgent) {
			bookings = bookings.map(b =>
				b.id === selectedBooking!.id ? { ...b, assigned_agent: selectedAgent, status: 'confirmed' as BookingStatus } : b
			);
			toastStore.success('Delivery agent assigned successfully');
		}
		showAssignModal = false;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-IN', { dateStyle: 'medium' });
	}
</script>

<svelte:head>
	<title>Manage Bookings - Admin</title>
</svelte:head>

<DashboardLayout
	role="admin"
	user={data.userProfile}
	title="Manage Bookings"
	breadcrumbs={[{ label: 'Bookings' }]}
>
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative flex-1 max-w-md">
			<Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				placeholder="Search by customer or vehicle..."
				bind:value={searchQuery}
				class="w-full rounded-lg border py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		<Select
			options={[
				{ value: '', label: 'All Status' },
				{ value: 'pending', label: 'Pending' },
				{ value: 'confirmed', label: 'Confirmed' },
				{ value: 'delivered', label: 'Delivered' },
				{ value: 'returned', label: 'Returned' },
				{ value: 'cancelled', label: 'Cancelled' }
			]}
			bind:value={statusFilter}
		/>
	</div>

	<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr class="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
						<th class="px-6 py-3">Customer</th>
						<th class="px-6 py-3">Vehicle</th>
						<th class="px-6 py-3">Duration</th>
						<th class="px-6 py-3">Status</th>
						<th class="px-6 py-3">Agent</th>
						<th class="px-6 py-3">Advance</th>
						<th class="px-6 py-3">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each filteredBookings as booking}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4">
								<div>
									<p class="font-medium text-gray-900">{booking.customer_name}</p>
									<p class="text-sm text-gray-500">{booking.phone}</p>
								</div>
							</td>
							<td class="px-6 py-4 text-gray-600">{booking.vehicle_model}</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{formatDate(booking.start_date)} - {formatDate(booking.end_date)}
							</td>
							<td class="px-6 py-4">
								<Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
							</td>
							<td class="px-6 py-4 text-gray-600">{booking.assigned_agent || '-'}</td>
							<td class="px-6 py-4 font-medium text-gray-900">₹{booking.advance_amount}</td>
							<td class="px-6 py-4">
								<div class="flex gap-2">
									<button
										onclick={() => { selectedBooking = booking; showDetailsModal = true; }}
										class="rounded p-1 text-gray-600 hover:bg-gray-100"
										title="View Details"
									>
										<Eye class="h-4 w-4" />
									</button>
									{#if booking.status === 'pending'}
										<button
											onclick={() => openAssignModal(booking)}
											class="rounded p-1 text-blue-600 hover:bg-blue-50"
											title="Assign Agent"
										>
											<UserPlus class="h-4 w-4" />
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<Modal open={showAssignModal} title="Assign Delivery Agent" onClose={() => (showAssignModal = false)}>
		<div class="space-y-4">
			<p class="text-gray-600">Assign a delivery agent for booking #{selectedBooking?.id.slice(0, 8)}</p>
			<Select
				label="Select Agent"
				options={deliveryAgents.map(a => ({ value: a.name, label: a.name }))}
				bind:value={selectedAgent}
				placeholder="Choose an agent"
			/>
		</div>
		{#snippet footer()}
			<Button variant="secondary" onclick={() => (showAssignModal = false)}>Cancel</Button>
			<Button variant="primary" onclick={handleAssign} disabled={!selectedAgent}>Assign</Button>
		{/snippet}
	</Modal>

	<Modal open={showDetailsModal} title="Booking Details" size="lg" onClose={() => (showDetailsModal = false)}>
		{#if selectedBooking}
			<div class="space-y-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-gray-500">Customer</p>
						<p class="font-medium">{selectedBooking.customer_name}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Phone</p>
						<p class="font-medium">{selectedBooking.phone}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Email</p>
						<p class="font-medium">{selectedBooking.email}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Vehicle</p>
						<p class="font-medium">{selectedBooking.vehicle_model}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Start Date</p>
						<p class="font-medium">{formatDate(selectedBooking.start_date)}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">End Date</p>
						<p class="font-medium">{formatDate(selectedBooking.end_date)}</p>
					</div>
					<div class="sm:col-span-2">
						<p class="text-sm text-gray-500">Delivery Location</p>
						<p class="font-medium">{selectedBooking.delivery_location}</p>
					</div>
				</div>
			</div>
		{/if}
	</Modal>
</DashboardLayout>
