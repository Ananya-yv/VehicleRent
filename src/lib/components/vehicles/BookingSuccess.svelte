<script lang="ts">
	import { CheckCircle, Copy, Calendar, MapPin, Car } from 'lucide-svelte';
	import { Modal, Button, Badge } from '$lib/components/ui';
	import { toastStore } from '$lib/stores/toast.svelte';

	interface BookingDetails {
		id: string;
		otp_code: string;
		vehicle_model: string;
		start_date: string;
		end_date: string;
		delivery_location: string;
		advance_amount: number;
		status: string;
	}

	interface Props {
		booking: BookingDetails | null;
		open: boolean;
		onClose: () => void;
	}

	let { booking, open, onClose }: Props = $props();

	function copyOTP() {
		if (booking?.otp_code) {
			navigator.clipboard.writeText(booking.otp_code);
			toastStore.success('OTP copied to clipboard!');
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<Modal {open} size="md" onClose={onClose}>
	{#if booking}
		<div class="text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
				<CheckCircle class="h-10 w-10 text-green-600" />
			</div>

			<h2 class="mb-2 text-xl font-bold text-gray-900">Booking Confirmed!</h2>
			<p class="mb-6 text-gray-600">Your booking has been successfully placed.</p>

			<div class="mb-6 rounded-lg bg-yellow-50 p-4">
				<p class="mb-2 text-sm font-medium text-yellow-800">Your OTP for verification</p>
				<div class="flex items-center justify-center gap-2">
					<span class="text-3xl font-bold tracking-widest text-yellow-900">{booking.otp_code}</span>
					<button
						onclick={copyOTP}
						class="rounded p-1 text-yellow-700 hover:bg-yellow-100"
						title="Copy OTP"
					>
						<Copy class="h-5 w-5" />
					</button>
				</div>
				<p class="mt-2 text-xs text-yellow-700">
					Share this OTP with the delivery agent during vehicle handover
				</p>
			</div>

			<div class="space-y-3 rounded-lg border p-4 text-left">
				<div class="flex items-center gap-3">
					<Car class="h-5 w-5 text-gray-400" />
					<div>
						<p class="text-sm text-gray-500">Vehicle</p>
						<p class="font-medium text-gray-900">{booking.vehicle_model}</p>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<Calendar class="h-5 w-5 text-gray-400" />
					<div>
						<p class="text-sm text-gray-500">Duration</p>
						<p class="font-medium text-gray-900">
							{formatDate(booking.start_date)} - {formatDate(booking.end_date)}
						</p>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<MapPin class="h-5 w-5 text-gray-400" />
					<div>
						<p class="text-sm text-gray-500">Delivery Location</p>
						<p class="font-medium text-gray-900">{booking.delivery_location}</p>
					</div>
				</div>

				<div class="flex items-center justify-between border-t pt-3">
					<span class="text-gray-600">Booking Status</span>
					<Badge variant="warning">{booking.status}</Badge>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-gray-600">Advance Paid</span>
					<span class="font-semibold text-green-600">₹{booking.advance_amount}</span>
				</div>
			</div>

			<div class="mt-6 flex justify-center gap-3">
				<Button variant="secondary" onclick={onClose}>Close</Button>
				<a href="/bookings/track?id={booking.id}">
					<Button variant="primary">Track Booking</Button>
				</a>
			</div>
		</div>
	{/if}
</Modal>
