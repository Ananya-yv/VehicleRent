<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { Input, Select, Button } from '$lib/components/ui';
	import { VehicleCard, BookingForm, BookingSuccess } from '$lib/components/vehicles';
	import { Search, Filter, X } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { RentType, AvailabilityStatus } from '$lib/database.types';

	interface Vehicle {
		id: string;
		model: string;
		type: string;
		rent_type: RentType;
		rent_price: number;
		condition: string | null;
		availability_status: AvailabilityStatus;
	}

	let vehicles = $state<Vehicle[]>([
		{ id: '1', model: 'Toyota Camry 2024', type: 'Sedan', rent_type: 'daily', rent_price: 2500, condition: 'Excellent', availability_status: 'available' },
		{ id: '2', model: 'Honda City', type: 'Sedan', rent_type: 'daily', rent_price: 1800, condition: 'Good', availability_status: 'available' },
		{ id: '3', model: 'Royal Enfield Classic 350', type: 'Motorcycle', rent_type: 'hourly', rent_price: 150, condition: 'Excellent', availability_status: 'available' },
		{ id: '4', model: 'Mahindra Thar', type: 'SUV', rent_type: 'daily', rent_price: 3500, condition: 'Excellent', availability_status: 'booked' },
		{ id: '5', model: 'Hyundai Creta', type: 'SUV', rent_type: 'daily', rent_price: 2800, condition: 'Excellent', availability_status: 'available' },
		{ id: '6', model: 'Maruti Swift', type: 'Hatchback', rent_type: 'daily', rent_price: 1200, condition: 'Good', availability_status: 'available' },
		{ id: '7', model: 'Honda Activa', type: 'Scooter', rent_type: 'hourly', rent_price: 50, condition: 'Good', availability_status: 'available' },
		{ id: '8', model: 'BMW 3 Series', type: 'Sedan', rent_type: 'daily', rent_price: 5500, condition: 'Excellent', availability_status: 'maintenance' }
	]);

	let searchQuery = $state('');
	let filterType = $state('');
	let filterRentType = $state('');
	let filterStatus = $state('available');
	let showFilters = $state(false);

	let selectedVehicle = $state<Vehicle | null>(null);
	let showBookingForm = $state(false);
	let showBookingSuccess = $state(false);
	let bookingLoading = $state(false);
	let bookingResult = $state<{
		id: string;
		otp_code: string;
		vehicle_model: string;
		start_date: string;
		end_date: string;
		delivery_location: string;
		advance_amount: number;
		status: string;
	} | null>(null);

	const vehicleTypes = [...new Set(vehicles.map(v => v.type))];

	const filteredVehicles = $derived.by(() => {
		return vehicles.filter(v => {
			const matchesSearch = v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
				v.type.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesType = !filterType || v.type === filterType;
			const matchesRentType = !filterRentType || v.rent_type === filterRentType;
			const matchesStatus = !filterStatus || v.availability_status === filterStatus;
			return matchesSearch && matchesType && matchesRentType && matchesStatus;
		});
	});

	function clearFilters() {
		searchQuery = '';
		filterType = '';
		filterRentType = '';
		filterStatus = 'available';
	}

	function handleBook(vehicle: Vehicle) {
		selectedVehicle = vehicle;
		showBookingForm = true;
	}

	async function handleBookingSubmit(formData: {
		vehicle_id: string;
		customer_name: string;
		phone: string;
		email: string;
		driving_license: string;
		delivery_location: string;
		start_date: string;
		end_date: string;
	}) {
		bookingLoading = true;
		await new Promise(r => setTimeout(r, 1500));

		bookingResult = {
			id: crypto.randomUUID(),
			otp_code: Math.random().toString().slice(2, 8),
			vehicle_model: selectedVehicle?.model || '',
			start_date: formData.start_date,
			end_date: formData.end_date,
			delivery_location: formData.delivery_location,
			advance_amount: (selectedVehicle?.rent_price || 0) * 0.2,
			status: 'pending'
		};

		bookingLoading = false;
		showBookingForm = false;
		showBookingSuccess = true;
		toastStore.success('Booking confirmed successfully!');
	}
</script>

<svelte:head>
	<title>Browse Vehicles - Vehicle Rental</title>
</svelte:head>

<DashboardLayout
	role="customer"
	title="Browse Vehicles"
	breadcrumbs={[{ label: 'Vehicles' }]}
>
	<div class="mb-6 rounded-xl border bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center">
			<div class="relative flex-1">
				<Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					placeholder="Search vehicles by name or type..."
					bind:value={searchQuery}
					class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div class="flex gap-2">
				<button
					onclick={() => (showFilters = !showFilters)}
					class="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					<Filter class="h-4 w-4" />
					Filters
					{#if filterType || filterRentType || filterStatus !== 'available'}
						<span class="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
							{[filterType, filterRentType, filterStatus !== 'available' ? filterStatus : ''].filter(Boolean).length}
						</span>
					{/if}
				</button>

				{#if filterType || filterRentType || filterStatus !== 'available' || searchQuery}
					<button
						onclick={clearFilters}
						class="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
					>
						<X class="h-4 w-4" />
						Clear
					</button>
				{/if}
			</div>
		</div>

		{#if showFilters}
			<div class="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
				<Select
					label="Vehicle Type"
					options={[{ value: '', label: 'All Types' }, ...vehicleTypes.map(t => ({ value: t, label: t }))]}
					bind:value={filterType}
				/>
				<Select
					label="Rent Type"
					options={[
						{ value: '', label: 'All' },
						{ value: 'daily', label: 'Daily' },
						{ value: 'hourly', label: 'Hourly' }
					]}
					bind:value={filterRentType}
				/>
				<Select
					label="Availability"
					options={[
						{ value: '', label: 'All' },
						{ value: 'available', label: 'Available' },
						{ value: 'booked', label: 'Booked' },
						{ value: 'maintenance', label: 'Maintenance' }
					]}
					bind:value={filterStatus}
				/>
			</div>
		{/if}
	</div>

	<div class="mb-4 text-sm text-gray-600">
		Showing {filteredVehicles.length} of {vehicles.length} vehicles
	</div>

	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each filteredVehicles as vehicle}
			<VehicleCard {vehicle} onBook={handleBook} />
		{/each}
	</div>

	{#if filteredVehicles.length === 0}
		<div class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
			<Search class="mx-auto h-12 w-12 text-gray-400" />
			<h3 class="mt-4 font-medium text-gray-900">No vehicles found</h3>
			<p class="mt-2 text-sm text-gray-600">Try adjusting your search or filters.</p>
			<button
				onclick={clearFilters}
				class="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
			>
				Clear all filters
			</button>
		</div>
	{/if}

	<BookingForm
		vehicle={selectedVehicle}
		open={showBookingForm}
		onClose={() => (showBookingForm = false)}
		onSubmit={handleBookingSubmit}
		loading={bookingLoading}
	/>

	<BookingSuccess
		booking={bookingResult}
		open={showBookingSuccess}
		onClose={() => (showBookingSuccess = false)}
	/>
</DashboardLayout>
