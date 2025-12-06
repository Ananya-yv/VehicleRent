<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { Badge, Button, Modal, Input, Select } from '$lib/components/ui';
	import { Truck, MapPin, Phone, Calendar, CheckCircle, Package, Eye } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { PageData } from './$types';
	import type { BookingStatus, DeliveryAction } from '$lib/database.types';

	let { data }: { data: PageData } = $props();

	interface AssignedBooking {
		id: string;
		customer_name: string;
		phone: string;
		email: string;
		vehicle_model: string;
		status: BookingStatus;
		delivery_location: string;
		start_date: string;
		end_date: string;
		otp_code: string;
	}

	let bookings = $state<AssignedBooking[]>([
		{ id: '1', customer_name: 'John Doe', phone: '+91 98765 43210', email: 'john@example.com', vehicle_model: 'Toyota Camry', status: 'confirmed', delivery_location: '123 Main Street, Mumbai, Maharashtra 400001', start_date: '2024-01-15T10:00', end_date: '2024-01-18T10:00', otp_code: '123456' },
		{ id: '2', customer_name: 'Jane Smith', phone: '+91 98765 43211', email: 'jane@example.com', vehicle_model: 'Honda City', status: 'confirmed', delivery_location: '456 Park Avenue, Pune, Maharashtra 411001', start_date: '2024-01-15T14:00', end_date: '2024-01-17T14:00', otp_code: '789012' },
		{ id: '3', customer_name: 'Mike Wilson', phone: '+91 98765 43212', email: 'mike@example.com', vehicle_model: 'Mahindra Thar', status: 'delivered', delivery_location: '789 Oak Lane, Delhi 110001', start_date: '2024-01-14T09:00', end_date: '2024-01-16T09:00', otp_code: '345678' },
		{ id: '4', customer_name: 'Sarah Brown', phone: '+91 98765 43213', email: 'sarah@example.com', vehicle_model: 'Hyundai Creta', status: 'returned', delivery_location: '321 Elm Street, Bangalore 560001', start_date: '2024-01-12T11:00', end_date: '2024-01-14T11:00', otp_code: '901234' }
	]);

	let selectedBooking = $state<AssignedBooking | null>(null);
	let showActionModal = $state(false);
	let showDetailsModal = $state(false);
	let actionType = $state<DeliveryAction>('delivered');
	let otpInput = $state('');
	let notes = $state('');
	let statusFilter = $state('');

	const statusColors: Record<BookingStatus, 'success' | 'warning' | 'info' | 'error'> = {
		pending: 'warning',
		confirmed: 'info',
		delivered: 'success',
		returned: 'success',
		cancelled: 'error'
	};

	const filteredBookings = $derived(
		bookings.filter(b => !statusFilter || b.status === statusFilter)
	);

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
	}

	function openActionModal(booking: AssignedBooking, action: DeliveryAction) {
		selectedBooking = booking;
		actionType = action;
		otpInput = '';
		notes = '';
		showActionModal = true;
	}

	function handleAction() {
		if (!selectedBooking) return;

		if (actionType === 'delivered' && otpInput !== selectedBooking.otp_code) {
			toastStore.error('Invalid OTP. Please verify with customer.');
			return;
		}

		const newStatus: BookingStatus = actionType === 'delivered' ? 'delivered' : 'returned';
		bookings = bookings.map(b =>
			b.id === selectedBooking!.id ? { ...b, status: newStatus } : b
		);

		toastStore.success(`Vehicle ${actionType === 'delivered' ? 'delivered' : 'picked up'} successfully!`);
		showActionModal = false;
	}
</script>

<svelte:head>
	<title>My Deliveries - Delivery Agent</title>
</svelte:head>

<DashboardLayout
	role="delivery"
	user={data.userProfile}
	title="My Deliveries"
	breadcrumbs={[{ label: 'Deliveries' }]}
>
	<div class="mb-6 flex items-center gap-4">
		<Select
			options={[
				{ value: '', label: 'All Status' },
				{ value: 'confirmed', label: 'Pending Delivery' },
				{ value: 'delivered', label: 'Delivered' },
				{ value: 'returned', label: 'Returned' }
			]}
			bind:value={statusFilter}
		/>
	</div>

	<div class="space-y-4">
		{#each filteredBookings as booking}
			<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
				<div class="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
					<div class="flex-1">
						<div class="mb-2 flex items-center gap-3">
							<h3 class="font-semibold text-gray-900">{booking.customer_name}</h3>
							<Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
						</div>
						<div class="grid gap-2 text-sm text-gray-600 md:grid-cols-2 lg:grid-cols-4">
							<div class="flex items-center gap-2">
								<Truck class="h-4 w-4 text-gray-400" />
								<span>{booking.vehicle_model}</span>
							</div>
							<div class="flex items-center gap-2">
								<Phone class="h-4 w-4 text-gray-400" />
								<a href="tel:{booking.phone}" class="hover:text-blue-600">{booking.phone}</a>
							</div>
							<div class="flex items-center gap-2">
								<Calendar class="h-4 w-4 text-gray-400" />
								<span>{formatDate(booking.start_date)}</span>
							</div>
							<div class="flex items-start gap-2">
								<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
								<span class="line-clamp-1">{booking.delivery_location}</span>
							</div>
						</div>
					</div>

					<div class="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							onclick={() => { selectedBooking = booking; showDetailsModal = true; }}
						>
							<Eye class="h-4 w-4" />
							Details
						</Button>

						{#if booking.status === 'confirmed'}
							<Button
								variant="primary"
								size="sm"
								onclick={() => openActionModal(booking, 'delivered')}
							>
								<Package class="h-4 w-4" />
								Mark Delivered
							</Button>
						{:else if booking.status === 'delivered'}
							<Button
								variant="outline"
								size="sm"
								onclick={() => openActionModal(booking, 'picked_up')}
							>
								<CheckCircle class="h-4 w-4" />
								Mark Picked Up
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/each}

		{#if filteredBookings.length === 0}
			<div class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
				<Truck class="mx-auto h-12 w-12 text-gray-400" />
				<p class="mt-4 font-medium text-gray-900">No deliveries found</p>
				<p class="text-sm text-gray-500">
					{statusFilter ? 'Try changing the filter' : 'No deliveries assigned yet'}
				</p>
			</div>
		{/if}
	</div>

	<Modal
		open={showActionModal}
		title={actionType === 'delivered' ? 'Confirm Delivery' : 'Confirm Pickup'}
		onClose={() => (showActionModal = false)}
	>
		{#if selectedBooking}
			<div class="space-y-4">
				<div class="rounded-lg bg-gray-50 p-4">
					<p class="text-sm text-gray-500">Customer</p>
					<p class="font-medium">{selectedBooking.customer_name}</p>
					<p class="text-sm text-gray-600">{selectedBooking.vehicle_model}</p>
				</div>

				{#if actionType === 'delivered'}
					<Input
						label="Enter OTP"
						placeholder="Enter 6-digit OTP from customer"
						bind:value={otpInput}
						required
					/>
					<p class="text-sm text-gray-500">
						Ask the customer for their OTP to verify delivery
					</p>
				{/if}

				<Input
					label="Notes (Optional)"
					placeholder="Add any notes about this delivery/pickup"
					bind:value={notes}
				/>
			</div>
		{/if}
		{#snippet footer()}
			<Button variant="secondary" onclick={() => (showActionModal = false)}>Cancel</Button>
			<Button
				variant="primary"
				onclick={handleAction}
				disabled={actionType === 'delivered' && !otpInput}
			>
				{actionType === 'delivered' ? 'Confirm Delivery' : 'Confirm Pickup'}
			</Button>
		{/snippet}
	</Modal>

	<Modal open={showDetailsModal} title="Booking Details" size="lg" onClose={() => (showDetailsModal = false)}>
		{#if selectedBooking}
			<div class="space-y-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-gray-500">Customer Name</p>
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

				{#if selectedBooking.status === 'confirmed'}
					<div class="rounded-lg bg-yellow-50 p-4 text-center">
						<p class="text-sm text-yellow-700">Verification OTP</p>
						<p class="text-2xl font-bold tracking-widest text-yellow-900">{selectedBooking.otp_code}</p>
					</div>
				{/if}
			</div>
		{/if}
	</Modal>
</DashboardLayout>
