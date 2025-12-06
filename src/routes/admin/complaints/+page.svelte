<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { Button, Badge, Modal, Select, Input } from '$lib/components/ui';
	import { Eye, UserPlus, Search, MessageSquare } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { PageData } from './$types';
	import type { ComplaintStatus, ComplaintPriority } from '$lib/database.types';

	let { data }: { data: PageData } = $props();

	interface Complaint {
		id: string;
		booking_id: string;
		customer_name: string;
		description: string;
		priority: ComplaintPriority;
		status: ComplaintStatus;
		helpline_agent?: string;
		created_at: string;
	}

	let complaints = $state<Complaint[]>([
		{ id: '1', booking_id: 'B001', customer_name: 'John Doe', description: 'Vehicle was not clean upon delivery', priority: 'medium', status: 'pending', created_at: '2024-01-15T10:00:00Z' },
		{ id: '2', booking_id: 'B002', customer_name: 'Jane Smith', description: 'Late delivery by 2 hours', priority: 'high', status: 'in_progress', helpline_agent: 'Priya Sharma', created_at: '2024-01-14T14:30:00Z' },
		{ id: '3', booking_id: 'B003', customer_name: 'Mike Wilson', description: 'Minor scratch on vehicle', priority: 'low', status: 'resolved', helpline_agent: 'Rahul Verma', created_at: '2024-01-13T09:15:00Z' }
	]);

	let helplineAgents = $state([
		{ id: '1', name: 'Priya Sharma' },
		{ id: '2', name: 'Rahul Verma' },
		{ id: '3', name: 'Neha Gupta' }
	]);

	let selectedComplaint = $state<Complaint | null>(null);
	let showAssignModal = $state(false);
	let showDetailsModal = $state(false);
	let selectedAgent = $state('');
	let searchQuery = $state('');
	let statusFilter = $state('');
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
			const matchesStatus = !statusFilter || c.status === statusFilter;
			const matchesPriority = !priorityFilter || c.priority === priorityFilter;
			return matchesSearch && matchesStatus && matchesPriority;
		})
	);

	function openAssignModal(complaint: Complaint) {
		selectedComplaint = complaint;
		selectedAgent = complaint.helpline_agent || '';
		showAssignModal = true;
	}

	function handleAssign() {
		if (selectedComplaint && selectedAgent) {
			complaints = complaints.map(c =>
				c.id === selectedComplaint!.id ? { ...c, helpline_agent: selectedAgent, status: 'in_progress' as ComplaintStatus } : c
			);
			toastStore.success('Helpline agent assigned successfully');
		}
		showAssignModal = false;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
	}
</script>

<svelte:head>
	<title>Manage Complaints - Admin</title>
</svelte:head>

<DashboardLayout
	role="admin"
	user={data.userProfile}
	title="Manage Complaints"
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
				{ value: '', label: 'All Status' },
				{ value: 'pending', label: 'Pending' },
				{ value: 'in_progress', label: 'In Progress' },
				{ value: 'resolved', label: 'Resolved' }
			]}
			bind:value={statusFilter}
		/>
		<Select
			options={[
				{ value: '', label: 'All Priority' },
				{ value: 'low', label: 'Low' },
				{ value: 'medium', label: 'Medium' },
				{ value: 'high', label: 'High' }
			]}
			bind:value={priorityFilter}
		/>
	</div>

	<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr class="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
						<th class="px-6 py-3">Complaint</th>
						<th class="px-6 py-3">Customer</th>
						<th class="px-6 py-3">Priority</th>
						<th class="px-6 py-3">Status</th>
						<th class="px-6 py-3">Agent</th>
						<th class="px-6 py-3">Date</th>
						<th class="px-6 py-3">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each filteredComplaints as complaint}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4">
								<p class="max-w-xs truncate text-gray-900">{complaint.description}</p>
								<p class="text-sm text-gray-500">Booking: {complaint.booking_id}</p>
							</td>
							<td class="px-6 py-4 text-gray-600">{complaint.customer_name}</td>
							<td class="px-6 py-4">
								<Badge variant={priorityColors[complaint.priority]}>{complaint.priority}</Badge>
							</td>
							<td class="px-6 py-4">
								<Badge variant={statusColors[complaint.status]}>{complaint.status.replace('_', ' ')}</Badge>
							</td>
							<td class="px-6 py-4 text-gray-600">{complaint.helpline_agent || '-'}</td>
							<td class="px-6 py-4 text-sm text-gray-600">{formatDate(complaint.created_at)}</td>
							<td class="px-6 py-4">
								<div class="flex gap-2">
									<button
										onclick={() => { selectedComplaint = complaint; showDetailsModal = true; }}
										class="rounded p-1 text-gray-600 hover:bg-gray-100"
										title="View Details"
									>
										<Eye class="h-4 w-4" />
									</button>
									{#if complaint.status === 'pending'}
										<button
											onclick={() => openAssignModal(complaint)}
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

		{#if filteredComplaints.length === 0}
			<div class="p-12 text-center">
				<MessageSquare class="mx-auto h-12 w-12 text-gray-400" />
				<p class="mt-4 text-gray-500">No complaints found</p>
			</div>
		{/if}
	</div>

	<Modal open={showAssignModal} title="Assign Helpline Agent" onClose={() => (showAssignModal = false)}>
		<div class="space-y-4">
			<p class="text-gray-600">Assign a helpline agent to handle this complaint</p>
			<Select
				label="Select Agent"
				options={helplineAgents.map(a => ({ value: a.name, label: a.name }))}
				bind:value={selectedAgent}
				placeholder="Choose an agent"
			/>
		</div>
		{#snippet footer()}
			<Button variant="secondary" onclick={() => (showAssignModal = false)}>Cancel</Button>
			<Button variant="primary" onclick={handleAssign} disabled={!selectedAgent}>Assign</Button>
		{/snippet}
	</Modal>

	<Modal open={showDetailsModal} title="Complaint Details" size="lg" onClose={() => (showDetailsModal = false)}>
		{#if selectedComplaint}
			<div class="space-y-4">
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
						<p class="text-sm text-gray-500">Booking ID</p>
						<p class="font-medium">{selectedComplaint.booking_id}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Priority</p>
						<Badge variant={priorityColors[selectedComplaint.priority]}>{selectedComplaint.priority}</Badge>
					</div>
					<div>
						<p class="text-sm text-gray-500">Status</p>
						<Badge variant={statusColors[selectedComplaint.status]}>{selectedComplaint.status.replace('_', ' ')}</Badge>
					</div>
				</div>
			</div>
		{/if}
	</Modal>
</DashboardLayout>
