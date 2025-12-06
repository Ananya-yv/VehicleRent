<script lang="ts">
	import { Input, Select, Button, Modal } from '$lib/components/ui';
	import { Calendar, User, Phone, Mail, CreditCard, MapPin, Car } from 'lucide-svelte';
	import type { RentType } from '$lib/database.types';

	interface Vehicle {
		id: string;
		model: string;
		type: string;
		rent_type: RentType;
		rent_price: number;
	}

	interface Props {
		vehicle: Vehicle | null;
		open: boolean;
		onClose: () => void;
		onSubmit: (data: BookingFormData) => void;
		loading?: boolean;
	}

	export interface BookingFormData {
		vehicle_id: string;
		customer_name: string;
		phone: string;
		email: string;
		driving_license: string;
		delivery_location: string;
		start_date: string;
		end_date: string;
	}

	let { vehicle, open, onClose, onSubmit, loading = false }: Props = $props();

	let formData = $state<Omit<BookingFormData, 'vehicle_id'>>({
		customer_name: '',
		phone: '',
		email: '',
		driving_license: '',
		delivery_location: '',
		start_date: '',
		end_date: ''
	});

	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		errors = {};

		if (!formData.customer_name.trim()) errors.customer_name = 'Name is required';
		if (!formData.phone.trim()) errors.phone = 'Phone is required';
		if (!formData.email.trim()) errors.email = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email';
		if (!formData.driving_license.trim()) errors.driving_license = 'License is required';
		if (!formData.delivery_location.trim()) errors.delivery_location = 'Location is required';
		if (!formData.start_date) errors.start_date = 'Start date is required';
		if (!formData.end_date) errors.end_date = 'End date is required';
		if (formData.start_date && formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
			errors.end_date = 'End date must be after start date';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!vehicle || !validate()) return;

		onSubmit({
			vehicle_id: vehicle.id,
			...formData
		});
	}

	function resetForm() {
		formData = {
			customer_name: '',
			phone: '',
			email: '',
			driving_license: '',
			delivery_location: '',
			start_date: '',
			end_date: ''
		};
		errors = {};
	}

	$effect(() => {
		if (!open) resetForm();
	});

	const minDate = new Date().toISOString().split('T')[0];
</script>

<Modal {open} title="Book Vehicle" size="lg" onClose={onClose}>
	{#if vehicle}
		<div class="mb-6 rounded-lg bg-blue-50 p-4">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-blue-100 p-2">
					<Car class="h-6 w-6 text-blue-600" />
				</div>
				<div>
					<h3 class="font-semibold text-gray-900">{vehicle.model}</h3>
					<p class="text-sm text-gray-600">
						{vehicle.type} • ₹{vehicle.rent_price}/{vehicle.rent_type === 'hourly' ? 'hr' : 'day'}
					</p>
				</div>
			</div>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					label="Full Name"
					placeholder="John Doe"
					required
					bind:value={formData.customer_name}
					error={errors.customer_name}
				/>
				<Input
					label="Phone Number"
					type="tel"
					placeholder="+91 98765 43210"
					required
					bind:value={formData.phone}
					error={errors.phone}
				/>
			</div>

			<Input
				label="Email Address"
				type="email"
				placeholder="john@example.com"
				required
				bind:value={formData.email}
				error={errors.email}
			/>

			<Input
				label="Driving License Number"
				placeholder="DL-1234567890123"
				required
				bind:value={formData.driving_license}
				error={errors.driving_license}
			/>

			<Input
				label="Delivery Location"
				placeholder="Full address for vehicle delivery"
				required
				bind:value={formData.delivery_location}
				error={errors.delivery_location}
			/>

			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					label="Start Date & Time"
					type="datetime-local"
					required
					min={minDate}
					bind:value={formData.start_date}
					error={errors.start_date}
				/>
				<Input
					label="End Date & Time"
					type="datetime-local"
					required
					min={formData.start_date || minDate}
					bind:value={formData.end_date}
					error={errors.end_date}
				/>
			</div>

			<div class="flex justify-end gap-3 pt-4">
				<Button variant="secondary" type="button" onclick={onClose}>
					Cancel
				</Button>
				<Button variant="primary" type="submit" {loading}>
					{loading ? 'Booking...' : 'Confirm Booking'}
				</Button>
			</div>
		</form>
	{/if}
</Modal>
