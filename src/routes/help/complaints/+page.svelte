<script lang="ts">
	import { page } from '$app/state';
	import { DashboardLayout } from '$lib/components/layouts';
	import { Badge, Button, Modal, Select, Input } from '$lib/components/ui';
	import { MessageSquare, Search, User, Phone, Calendar, Eye } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { PageData } from './$types';
	import type { ComplaintStatus, ComplaintPriority } from '$lib/database.types';

	let { data }: { data: PageData } = $props();

	interface Complaint {
		id: string;
		booking_id: string;
		customer_name: string;
		phone: string;
		email: string;
		description: string;
		priority: ComplaintPriority;
		status: ComplaintStatus;
		assigned_to_me: boolean;
		created_at: string;
		vehicle_model: string;
	}

	let complaints = $state<Complaint[]>([
		{ id: '1', booking_id: 'B001', customer_name: 'John Doe', phone: '+91 98765 43210', email: 'john@example.com', description: 'Vehicle was not clean upon delivery, found dust and debris inside the car', priority: 'medium', status: 'pending', assigned_to_me: false, created_at: '2024-01-15T10:00:00Z', vehicle_model: 'Toyota Camry' },
		{ id: '2', booking_id: 'B002', customer_name: 'Jane Smith', phone: '+91 98765 43211', email: 'jane@example.com', description: 'Late delivery by 2 hours, no prior communication from the delivery agent', priority: 'high', status: 'in_progress', assigned_to_me: true, created_at: '2024-01-14T14:30:00Z', vehicle_model: 'Honda City' },
		{ id: '3', booking_id: 'B003', customer_name: 'Mike Wilson', phone: '+91 98765 43212', email: 'mike@example.com', description: 'Minor scratch noticed on the door, needs documentation', priority: 'low', status: 'pending', assigned_to_me: false, created_at: '2024-01-14T09:15:00Z', vehicle_model: 'Mahindra Thar' },
		{ id: '4', booking_id: 'B004', customer_name: 'Sarah Brown', phone: '+91 98765 43213', email: 'sarah@example.com', description: 'AC not working properly in the vehicle', priority: 'high', status: 'in_progress', assigned_to_me: true, created_at: '2024-01-13T16:45:00Z', vehicle_model: 'Hyundai Creta' },
		{ id: '5', booking_id: 'B005', customer_name: 'Tom Davis', phone: '+91 98765 43214', email: 'tom@example.com', description: 'Wrong vehicle delivered', priority: 'high', status: 'resolved', assigned_to_me: true, created_at: '2024-01-12T11:00:00Z', vehicle_model: 'Maruti Swift' }
	]);

	let selectedComplaint = $state<Complaint | null>(null);
	let showDetailsModal = $state(false);
	let showStatusModal = $state(false);
	let newStatus = $state<ComplaintStatus>('pending');
	let resolution = $state('');
	let searchQuery = $state('');
	let statusFilter = $state(page.url.searchParams.get('filter') === 'mine' ? 'mine' : '');
	let priorityFilter = $state('');

	const statusColors: Record<ComplaintStatus, 'success' | 'warning' | 'info'> = {
		pending: 'warning',
		in_progress: 'info',
		resolved: 'success'
	};

	const priorityColors: Record<ComplaintPriority, 'success' | 'warning' | 'error'> = {
		low: 'success',
		medium: 'warning',
		high: 'error'
	};

	const filteredComplaints = $derived(
		complaints.filter(c => {
			const matchesSearch = c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.description.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = !statusFilter || (statusFilter === 'mine' ? c.assigned_to_me : c.status === statusFilter);
			const matchesPriority = !priorityFilter || c.priority === priorityFilter;
			return matchesSearch && matchesStatus && matchesPriority;
		})
	);

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
	}

	function claimComplaint(complaint: Complaint) {
		complaints = complaints.map(c =>
			c.id === complaint.id ? { ...c, assigned_to_me: true, status: 'in_progress' as ComplaintStatus } : c
		);
		toastStore.success('Complaint claimed successfully!');
	}

	function openStatusModal(complaint: Complaint) {
		selectedComplaint = complaint;
		newStatus = complaint.status;
		resolution = '';
		showStatusModal = true;
	}

	function updateStatus() {
		if (!selectedComplaint) return;

		complaints = complaints.map(c =>
			c.id === selectedComplaint!.id ? { ...c, status: newStatus } : c
		);
		toastStore.success('Status updated successfully!');
		showStatusModal = false;
	}
</script>

<svelte:head>
	<title>Complaints - Helpline Agent</title>
</svelte:head>

<DashboardLayout
	role="helpline"
	user={data.userProfile}
	title="Complaints"
	breadcrumbs={[{ label: 'Complaints' }]}
>
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative flex-1 max-w-md">
			<Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				placeholder="Search complaints..."
				bind:value={searchQuery}
				class="w-full rounded-lg border py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		<Select
			options={[
				{ value: '', label: 'All Complaints' },
				{ value: 'mine', label: 'My Assigned' },
				{ value: 'pending', label: 'Pending' },
				{ value: 'in_progress', label: 'In Progress' },
				{ value: 'resolved', label: 'Resolved' }
			]}
			bind:value={statusFilter}
		/>
		<Select
			options={[
				{ value: '', label: 'All Priority' },
				{ value: 'high', label: 'High' },
				{ value: 'medium', label: 'Medium' },
				{ value: 'low', label: 'Low' }
			]}
			bind:value={priorityFilter}
		/>
	</div>

	<div class="space-y-4">
		{#each filteredComplaints as complaint}
			<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
				<div class="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
					<div class="flex-1">
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<Badge variant={priorityColors[complaint.priority]}>{complaint.priority}</Badge>
							<Badge variant={statusColors[complaint.status]}>{complaint.status.replace('_', ' ')}</Badge>
							{#if complaint.assigned_to_me}
								<Badge variant="purple">Assigned to me</Badge>
							{/if}
						</div>

						<h3 class="mb-1 font-semibold text-gray-900">{complaint.customer_name}</h3>
						<p class="mb-3 text-gray-600">{complaint.description}</p>

						<div class="flex flex-wrap gap-4 text-sm text-gray-500">
							<div class="flex items-center gap-1">
								<Phone class="h-4 w-4" />
								<a href="tel:{complaint.phone}" class="hover:text-blue-600">{complaint.phone}</a>
							</div>
							<div class="flex items-center gap-1">
								<Calendar class="h-4 w-4" />
								{formatDate(complaint.created_at)}
							</div>
							<div>Booking: {complaint.booking_id}</div>
							<div>Vehicle: {complaint.vehicle_model}</div>
						</div>
					</div>

					<div class="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							onclick={() => { selectedComplaint = complaint; showDetailsModal = true; }}
						>
							<Eye class="h-4 w-4" />
							Details
						</Button>

						{#if !complaint.assigned_to_me && complaint.status === 'pending'}
							<Button
								variant="primary"
								size="sm"
								onclick={() => claimComplaint(complaint)}
							>
								<User class="h-4 w-4" />
								Claim
							</Button>
						{:else if complaint.assigned_to_me && complaint.status !== 'resolved'}
							<Button
								variant="outline"
								size="sm"
								onclick={() => openStatusModal(complaint)}
							>
								Update Status
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/each}

		{#if filteredComplaints.length === 0}
			<div class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
				<MessageSquare class="mx-auto h-12 w-12 text-gray-400" />
				<p class="mt-4 font-medium text-gray-900">No complaints found</p>
				<p class="text-sm text-gray-500">Try adjusting your filters</p>
			</div>
		{/if}
	</div>

	<Modal open={showDetailsModal} title="Complaint Details" size="lg" onClose={() => (showDetailsModal = false)}>
		{#if selectedComplaint}
			<div class="space-y-4">
				<div class="flex gap-2">
					<Badge variant={priorityColors[selectedComplaint.priority]}>{selectedComplaint.priority} priority</Badge>
					<Badge variant={statusColors[selectedComplaint.status]}>{selectedComplaint.status.replace('_', ' ')}</Badge>
				</div>

				<div class="rounded-lg bg-gray-50 p-4">
					<p class="text-sm text-gray-500">Description</p>
					<p class="mt-1 text-gray-900">{selectedComplaint.description}</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-gray-500">Customer</p>
						<p class="font-medium">{selectedComplaint.customer_name}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Phone</p>
						<p class="font-medium">{selectedComplaint.phone}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Email</p>
						<p class="font-medium">{selectedComplaint.email}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Booking ID</p>
						<p class="font-medium">{selectedComplaint.booking_id}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Vehicle</p>
						<p class="font-medium">{selectedComplaint.vehicle_model}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Created</p>
						<p class="font-medium">{formatDate(selectedComplaint.created_at)}</p>
					</div>
				</div>
			</div>
		{/if}
	</Modal>

	<Modal open={showStatusModal} title="Update Status" onClose={() => (showStatusModal = false)}>
		<div class="space-y-4">
			<Select
				label="Status"
				options={[
					{ value: 'pending', label: 'Pending' },
					{ value: 'in_progress', label: 'In Progress' },
					{ value: 'resolved', label: 'Resolved' }
				]}
				bind:value={newStatus}
			/>

			{#if newStatus === 'resolved'}
				<Input
					label="Resolution Notes"
					placeholder="Describe how the issue was resolved..."
					bind:value={resolution}
				/>
			{/if}
		</div>
		{#snippet footer()}
			<Button variant="secondary" onclick={() => (showStatusModal = false)}>Cancel</Button>
			<Button variant="primary" onclick={updateStatus}>Update</Button>
		{/snippet}
	</Modal>
</DashboardLayout>
