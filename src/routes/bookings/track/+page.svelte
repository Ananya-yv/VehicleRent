<script lang="ts">
	import { page } from '$app/state';
	import { DashboardLayout } from '$lib/components/layouts';
	import { Input, Button, Badge } from '$lib/components/ui';
	import { Search, Car, Calendar, MapPin, Phone, Mail, CheckCircle, Truck, Package } from 'lucide-svelte';

	let bookingId = $state(page.url.searchParams.get('id') || '');
	let searchedBooking = $state<{
		id: string;
		status: 'pending' | 'confirmed' | 'delivered' | 'returned' | 'cancelled';
		vehicle_model: string;
		customer_name: string;
		phone: string;
		email: string;
		delivery_location: string;
		start_date: string;
		end_date: string;
		otp_code: string;
		advance_amount: number;
		delivery_agent?: string;
	} | null>(null);
	let loading = $state(false);
	let error = $state('');

	const statusConfig = {
		pending: { color: 'warning' as const, label: 'Pending Confirmation' },
		confirmed: { color: 'info' as const, label: 'Confirmed' },
		delivered: { color: 'success' as const, label: 'Delivered' },
		returned: { color: 'success' as const, label: 'Returned' },
		cancelled: { color: 'error' as const, label: 'Cancelled' }
	};

	const statusSteps = [
		{ key: 'pending', label: 'Booking Placed', icon: Package },
		{ key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
		{ key: 'delivered', label: 'Vehicle Delivered', icon: Truck },
		{ key: 'returned', label: 'Vehicle Returned', icon: Car }
	];

	async function searchBooking() {
		if (!bookingId.trim()) {
			error = 'Please enter a booking ID';
			return;
		}

		loading = true;
		error = '';

		await new Promise(r => setTimeout(r, 1000));

		searchedBooking = {
			id: bookingId,
			status: 'confirmed',
			vehicle_model: 'Toyota Camry 2024',
			customer_name: 'John Doe',
			phone: '+91 98765 43210',
			email: 'john@example.com',
			delivery_location: '123 Main Street, Mumbai, Maharashtra 400001',
			start_date: new Date().toISOString(),
			end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
			otp_code: '123456',
			advance_amount: 500,
			delivery_agent: 'Raj Kumar'
		};

		loading = false;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	function getStepStatus(stepKey: string, currentStatus: string): 'completed' | 'current' | 'upcoming' {
		const order = ['pending', 'confirmed', 'delivered', 'returned'];
		const currentIndex = order.indexOf(currentStatus);
		const stepIndex = order.indexOf(stepKey);

		if (stepIndex < currentIndex) return 'completed';
		if (stepIndex === currentIndex) return 'current';
		return 'upcoming';
	}
</script>

<svelte:head>
	<title>Track Booking - Vehicle Rental</title>
</svelte:head>

<DashboardLayout
	role="customer"
	title="Track Your Booking"
	breadcrumbs={[{ label: 'Track Booking' }]}
>
	<div class="mx-auto max-w-3xl">
		<div class="mb-8 rounded-xl border bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Enter Booking ID</h2>
			<form onsubmit={(e) => { e.preventDefault(); searchBooking(); }} class="flex gap-3">
				<div class="flex-1">
					<Input
						placeholder="Enter your booking ID or phone number"
						bind:value={bookingId}
						error={error}
					/>
				</div>
				<Button variant="primary" type="submit" {loading}>
					<Search class="h-4 w-4" />
					Search
				</Button>
			</form>
		</div>

		{#if searchedBooking}
			<div class="space-y-6">
				<div class="rounded-xl border bg-white p-6 shadow-sm">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900">Booking Status</h3>
						<Badge variant={statusConfig[searchedBooking.status].color}>
							{statusConfig[searchedBooking.status].label}
						</Badge>
					</div>

					<div class="relative">
						<div class="flex justify-between">
							{#each statusSteps as step, index}
								{@const status = getStepStatus(step.key, searchedBooking.status)}
								<div class="flex flex-col items-center {index === 0 ? '' : 'flex-1'}">
									{#if index > 0}
										<div class="absolute top-5 h-0.5 w-full -translate-y-1/2 {status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}" style="left: {(index - 1) * (100 / (statusSteps.length - 1))}%; width: {100 / (statusSteps.length - 1)}%"></div>
									{/if}
									<div class="relative z-10 flex h-10 w-10 items-center justify-center rounded-full {status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}">
										<step.icon class="h-5 w-5" />
									</div>
									<span class="mt-2 text-center text-xs font-medium {status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}">
										{step.label}
									</span>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-2">
					<div class="rounded-xl border bg-white p-6 shadow-sm">
						<h3 class="mb-4 font-semibold text-gray-900">Vehicle Details</h3>
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-blue-100 p-3">
								<Car class="h-6 w-6 text-blue-600" />
							</div>
							<div>
								<p class="font-medium text-gray-900">{searchedBooking.vehicle_model}</p>
								<p class="text-sm text-gray-500">Booking ID: {searchedBooking.id.slice(0, 8)}...</p>
							</div>
						</div>
					</div>

					<div class="rounded-xl border bg-white p-6 shadow-sm">
						<h3 class="mb-4 font-semibold text-gray-900">OTP Verification</h3>
						<div class="rounded-lg bg-yellow-50 p-4 text-center">
							<p class="text-sm text-yellow-800">Your OTP Code</p>
							<p class="text-2xl font-bold tracking-widest text-yellow-900">{searchedBooking.otp_code}</p>
						</div>
					</div>
				</div>

				<div class="rounded-xl border bg-white p-6 shadow-sm">
					<h3 class="mb-4 font-semibold text-gray-900">Booking Information</h3>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="flex items-start gap-3">
							<Calendar class="h-5 w-5 text-gray-400" />
							<div>
								<p class="text-sm text-gray-500">Duration</p>
								<p class="font-medium text-gray-900">{formatDate(searchedBooking.start_date)}</p>
								<p class="text-sm text-gray-600">to {formatDate(searchedBooking.end_date)}</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<MapPin class="h-5 w-5 text-gray-400" />
							<div>
								<p class="text-sm text-gray-500">Delivery Location</p>
								<p class="font-medium text-gray-900">{searchedBooking.delivery_location}</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<Phone class="h-5 w-5 text-gray-400" />
							<div>
								<p class="text-sm text-gray-500">Contact</p>
								<p class="font-medium text-gray-900">{searchedBooking.phone}</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<Truck class="h-5 w-5 text-gray-400" />
							<div>
								<p class="text-sm text-gray-500">Delivery Agent</p>
								<p class="font-medium text-gray-900">{searchedBooking.delivery_agent || 'Not assigned yet'}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-xl border bg-green-50 p-4">
					<div class="flex items-center justify-between">
						<span class="text-gray-700">Advance Paid</span>
						<span class="text-xl font-bold text-green-600">₹{searchedBooking.advance_amount}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</DashboardLayout>
