<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { Button, Badge } from '$lib/components/ui';
	import { VehicleCard, BookingForm, BookingSuccess } from '$lib/components/vehicles';
	import { Car, Search, Shield, Clock, ArrowRight } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { PageData } from './$types';
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

	let { data }: { data: PageData } = $props();

	let vehicles = $state<Vehicle[]>([
		{
			id: '1',
			model: 'Toyota Camry 2024',
			type: 'Sedan',
			rent_type: 'daily',
			rent_price: 2500,
			condition: 'Excellent',
			availability_status: 'available'
		},
		{
			id: '2',
			model: 'Honda City',
			type: 'Sedan',
			rent_type: 'daily',
			rent_price: 1800,
			condition: 'Good',
			availability_status: 'available'
		},
		{
			id: '3',
			model: 'Royal Enfield Classic 350',
			type: 'Motorcycle',
			rent_type: 'hourly',
			rent_price: 150,
			condition: 'Excellent',
			availability_status: 'available'
		},
		{
			id: '4',
			model: 'Mahindra Thar',
			type: 'SUV',
			rent_type: 'daily',
			rent_price: 3500,
			condition: 'Excellent',
			availability_status: 'booked'
		}
	]);

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

		await new Promise((r) => setTimeout(r, 1500));

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

	const features = [
		{
			icon: Car,
			title: 'Wide Selection',
			description: 'Choose from a variety of cars, bikes, and SUVs'
		},
		{
			icon: Shield,
			title: 'Insured Vehicles',
			description: 'All vehicles come with comprehensive insurance'
		},
		{
			icon: Clock,
			title: '24/7 Support',
			description: 'Round-the-clock customer support for your convenience'
		}
	];
</script>

<svelte:head>
	<title>Vehicle Rental - Rent Cars, Bikes & SUVs</title>
</svelte:head>

<DashboardLayout role="customer">
	<section class="mb-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white md:p-12">
		<div class="max-w-2xl">
			<h1 class="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
				Find Your Perfect Ride
			</h1>
			<p class="mb-6 text-lg text-blue-100">
				Rent quality vehicles at affordable prices. From daily commutes to weekend adventures,
				we've got you covered.
			</p>
			<div class="flex flex-wrap gap-4">
				<a href="/vehicles">
					<Button variant="secondary" size="lg">
						Browse Vehicles
						<ArrowRight class="h-5 w-5" />
					</Button>
				</a>
				<a href="/bookings/track">
					<Button variant="ghost" size="lg" class="border border-white/30 text-white hover:bg-white/10">
						Track My Booking
					</Button>
				</a>
			</div>
		</div>
	</section>

	<section class="mb-12 grid gap-6 md:grid-cols-3">
		{#each features as feature}
			<div class="rounded-xl border bg-white p-6 text-center shadow-sm">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
					<feature.icon class="h-6 w-6 text-blue-600" />
				</div>
				<h3 class="mb-2 font-semibold text-gray-900">{feature.title}</h3>
				<p class="text-sm text-gray-600">{feature.description}</p>
			</div>
		{/each}
	</section>

	<section>
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold text-gray-900">Available Vehicles</h2>
				<p class="text-gray-600">Browse our selection of quality rental vehicles</p>
			</div>
			<a href="/vehicles" class="text-sm font-medium text-blue-600 hover:text-blue-700">
				View all →
			</a>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each vehicles.filter(v => v.availability_status === 'available').slice(0, 4) as vehicle}
				<VehicleCard {vehicle} onBook={handleBook} />
			{/each}
		</div>

		{#if vehicles.filter(v => v.availability_status === 'available').length === 0}
			<div class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
				<Car class="mx-auto h-12 w-12 text-gray-400" />
				<h3 class="mt-4 font-medium text-gray-900">No vehicles available</h3>
				<p class="mt-2 text-sm text-gray-600">Please check back later for available vehicles.</p>
			</div>
		{/if}
	</section>

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
