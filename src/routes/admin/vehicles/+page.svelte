<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { Button, Badge, Modal, Input, Select } from '$lib/components/ui';
	import { Plus, Pencil, Trash2, Car, Search } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { PageData } from './$types';
	import type { RentType, AvailabilityStatus } from '$lib/database.types';

	let { data }: { data: PageData } = $props();

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
		{ id: '3', model: 'Royal Enfield Classic 350', type: 'Motorcycle', rent_type: 'hourly', rent_price: 150, condition: 'Excellent', availability_status: 'booked' },
		{ id: '4', model: 'Mahindra Thar', type: 'SUV', rent_type: 'daily', rent_price: 3500, condition: 'Excellent', availability_status: 'maintenance' }
	]);

	let showModal = $state(false);
	let editingVehicle = $state<Vehicle | null>(null);
	let searchQuery = $state('');
	let deleteConfirm = $state<Vehicle | null>(null);

	let formData = $state({
		model: '',
		type: '',
		rent_type: 'daily' as RentType,
		rent_price: 0,
		condition: '',
		availability_status: 'available' as AvailabilityStatus
	});

	const statusColors: Record<AvailabilityStatus, 'success' | 'warning' | 'error'> = {
		available: 'success',
		booked: 'warning',
		maintenance: 'error'
	};

	const filteredVehicles = $derived(
		vehicles.filter(v =>
			v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
			v.type.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function openAddModal() {
		editingVehicle = null;
		formData = { model: '', type: '', rent_type: 'daily', rent_price: 0, condition: '', availability_status: 'available' };
		showModal = true;
	}

	function openEditModal(vehicle: Vehicle) {
		editingVehicle = vehicle;
		formData = { ...vehicle, condition: vehicle.condition || '' };
		showModal = true;
	}

	function handleSubmit() {
		if (editingVehicle) {
			vehicles = vehicles.map(v => v.id === editingVehicle!.id ? { ...v, ...formData } : v);
			toastStore.success('Vehicle updated successfully');
		} else {
			vehicles = [...vehicles, { id: crypto.randomUUID(), ...formData }];
			toastStore.success('Vehicle added successfully');
		}
		showModal = false;
	}

	function handleDelete(vehicle: Vehicle) {
		vehicles = vehicles.filter(v => v.id !== vehicle.id);
		deleteConfirm = null;
		toastStore.success('Vehicle deleted successfully');
	}
</script>

<svelte:head>
	<title>Manage Vehicles - Admin</title>
</svelte:head>

<DashboardLayout
	role="admin"
	user={data.userProfile}
	title="Manage Vehicles"
	breadcrumbs={[{ label: 'Vehicles' }]}
>
	{#snippet actions()}
		<Button variant="primary" onclick={openAddModal}>
			<Plus class="h-4 w-4" />
			Add Vehicle
		</Button>
	{/snippet}

	<div class="mb-6 flex items-center gap-4">
		<div class="relative flex-1 max-w-md">
			<Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				placeholder="Search vehicles..."
				bind:value={searchQuery}
				class="w-full rounded-lg border py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
	</div>

	<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr class="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
						<th class="px-6 py-3">Vehicle</th>
						<th class="px-6 py-3">Type</th>
						<th class="px-6 py-3">Rent Type</th>
						<th class="px-6 py-3">Price</th>
						<th class="px-6 py-3">Condition</th>
						<th class="px-6 py-3">Status</th>
						<th class="px-6 py-3">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each filteredVehicles as vehicle}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
										<Car class="h-5 w-5 text-gray-600" />
									</div>
									<span class="font-medium text-gray-900">{vehicle.model}</span>
								</div>
							</td>
							<td class="px-6 py-4 text-gray-600">{vehicle.type}</td>
							<td class="px-6 py-4 text-gray-600 capitalize">{vehicle.rent_type}</td>
							<td class="px-6 py-4 font-medium text-gray-900">₹{vehicle.rent_price}</td>
							<td class="px-6 py-4 text-gray-600">{vehicle.condition || '-'}</td>
							<td class="px-6 py-4">
								<Badge variant={statusColors[vehicle.availability_status]}>
									{vehicle.availability_status}
								</Badge>
							</td>
							<td class="px-6 py-4">
								<div class="flex gap-2">
									<button
										onclick={() => openEditModal(vehicle)}
										class="rounded p-1 text-gray-600 hover:bg-gray-100"
									>
										<Pencil class="h-4 w-4" />
									</button>
									<button
										onclick={() => (deleteConfirm = vehicle)}
										class="rounded p-1 text-red-600 hover:bg-red-50"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if filteredVehicles.length === 0}
			<div class="p-12 text-center">
				<Car class="mx-auto h-12 w-12 text-gray-400" />
				<p class="mt-4 text-gray-500">No vehicles found</p>
			</div>
		{/if}
	</div>

	<Modal
		open={showModal}
		title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
		onClose={() => (showModal = false)}
	>
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			<Input label="Model" required bind:value={formData.model} placeholder="Toyota Camry 2024" />
			<Input label="Type" required bind:value={formData.type} placeholder="Sedan, SUV, Motorcycle..." />

			<div class="grid gap-4 sm:grid-cols-2">
				<Select
					label="Rent Type"
					required
					bind:value={formData.rent_type}
					options={[
						{ value: 'daily', label: 'Daily' },
						{ value: 'hourly', label: 'Hourly' }
					]}
				/>
				<Input
					label="Price"
					type="number"
					required
					bind:value={formData.rent_price}
					placeholder="2500"
				/>
			</div>

			<Input label="Condition" bind:value={formData.condition} placeholder="Excellent, Good, Fair..." />

			<Select
				label="Availability"
				required
				bind:value={formData.availability_status}
				options={[
					{ value: 'available', label: 'Available' },
					{ value: 'booked', label: 'Booked' },
					{ value: 'maintenance', label: 'Maintenance' }
				]}
			/>

			<div class="flex justify-end gap-3 pt-4">
				<Button variant="secondary" type="button" onclick={() => (showModal = false)}>Cancel</Button>
				<Button variant="primary" type="submit">{editingVehicle ? 'Save Changes' : 'Add Vehicle'}</Button>
			</div>
		</form>
	</Modal>

	<Modal
		open={!!deleteConfirm}
		title="Confirm Delete"
		onClose={() => (deleteConfirm = null)}
	>
		<p class="text-gray-600">Are you sure you want to delete "{deleteConfirm?.model}"? This action cannot be undone.</p>
		{#snippet footer()}
			<Button variant="secondary" onclick={() => (deleteConfirm = null)}>Cancel</Button>
			<Button variant="danger" onclick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
		{/snippet}
	</Modal>
</DashboardLayout>
