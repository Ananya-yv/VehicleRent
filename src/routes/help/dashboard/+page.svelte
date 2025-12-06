<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { StatsCard, Badge, Button } from '$lib/components/ui';
	import { MessageSquare, Clock, CheckCircle, AlertTriangle, ArrowRight, User } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { ComplaintStatus, ComplaintPriority } from '$lib/database.types';

	let { data }: { data: PageData } = $props();

	const stats = [
		{ title: 'Open Complaints', value: 5, icon: AlertTriangle, color: 'red' as const },
		{ title: 'In Progress', value: 3, icon: Clock, color: 'yellow' as const },
		{ title: 'Resolved Today', value: 8, icon: CheckCircle, color: 'green' as const }
	];

	interface Complaint {
		id: string;
		booking_id: string;
		customer_name: string;
		phone: string;
		description: string;
		priority: ComplaintPriority;
		status: ComplaintStatus;
		assigned_to_me: boolean;
		created_at: string;
	}

	let complaints = $state<Complaint[]>([
		{ id: '1', booking_id: 'B001', customer_name: 'John Doe', phone: '+91 98765 43210', description: 'Vehicle was not clean upon delivery, found dust and debris inside', priority: 'medium', status: 'pending', assigned_to_me: false, created_at: '2024-01-15T10:00:00Z' },
		{ id: '2', booking_id: 'B002', customer_name: 'Jane Smith', phone: '+91 98765 43211', description: 'Late delivery by 2 hours, no prior communication', priority: 'high', status: 'in_progress', assigned_to_me: true, created_at: '2024-01-14T14:30:00Z' },
		{ id: '3', booking_id: 'B003', customer_name: 'Mike Wilson', phone: '+91 98765 43212', description: 'Minor scratch noticed on the door', priority: 'low', status: 'pending', assigned_to_me: false, created_at: '2024-01-14T09:15:00Z' }
	]);

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

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
	}

	function getTimeAgo(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		if (hours < 1) return 'Just now';
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	const myComplaints = $derived(complaints.filter(c => c.assigned_to_me));
	const unassignedComplaints = $derived(complaints.filter(c => !c.assigned_to_me && c.status === 'pending'));
</script>

<svelte:head>
	<title>Helpline Dashboard - Vehicle Rental</title>
</svelte:head>

<DashboardLayout
	role="helpline"
	user={data.userProfile}
	title="My Dashboard"
>
	<div class="grid gap-6 md:grid-cols-3">
		{#each stats as stat}
			<StatsCard
				title={stat.title}
				value={stat.value}
				icon={stat.icon}
				color={stat.color}
			/>
		{/each}
	</div>

	<div class="mt-8 grid gap-8 lg:grid-cols-2">
		<div>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">My Assigned Complaints</h2>
				<a href="/help/complaints?filter=mine" class="text-sm text-blue-600 hover:text-blue-700">View all →</a>
			</div>

			{#if myComplaints.length === 0}
				<div class="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
					<CheckCircle class="mx-auto h-10 w-10 text-green-500" />
					<p class="mt-2 font-medium text-gray-900">All caught up!</p>
					<p class="text-sm text-gray-500">No complaints assigned to you.</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each myComplaints as complaint}
						<a href="/help/complaints/{complaint.id}" class="block rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
							<div class="mb-2 flex items-start justify-between">
								<div class="flex items-center gap-2">
									<Badge variant={priorityColors[complaint.priority]}>{complaint.priority}</Badge>
									<Badge variant={statusColors[complaint.status]}>{complaint.status.replace('_', ' ')}</Badge>
								</div>
								<span class="text-xs text-gray-500">{getTimeAgo(complaint.created_at)}</span>
							</div>
							<p class="mb-2 font-medium text-gray-900">{complaint.customer_name}</p>
							<p class="line-clamp-2 text-sm text-gray-600">{complaint.description}</p>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<div>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Unassigned Complaints</h2>
				<a href="/help/complaints" class="text-sm text-blue-600 hover:text-blue-700">View all →</a>
			</div>

			{#if unassignedComplaints.length === 0}
				<div class="rounded-xl border bg-white p-8 text-center">
					<MessageSquare class="mx-auto h-10 w-10 text-gray-400" />
					<p class="mt-2 text-gray-500">No unassigned complaints</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each unassignedComplaints as complaint}
						<div class="rounded-xl border bg-white p-4 shadow-sm">
							<div class="mb-2 flex items-start justify-between">
								<div class="flex items-center gap-2">
									<Badge variant={priorityColors[complaint.priority]}>{complaint.priority}</Badge>
								</div>
								<span class="text-xs text-gray-500">{getTimeAgo(complaint.created_at)}</span>
							</div>
							<p class="mb-2 font-medium text-gray-900">{complaint.customer_name}</p>
							<p class="mb-3 line-clamp-2 text-sm text-gray-600">{complaint.description}</p>
							<Button variant="outline" size="sm" class="w-full">
								<User class="h-4 w-4" />
								Claim This Complaint
							</Button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-8">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
		<div class="grid gap-4 md:grid-cols-3">
			<a href="/help/complaints" class="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:bg-gray-50">
				<div class="rounded-lg bg-blue-100 p-3">
					<MessageSquare class="h-6 w-6 text-blue-600" />
				</div>
				<div>
					<p class="font-medium text-gray-900">View All Complaints</p>
					<p class="text-sm text-gray-500">Browse and manage complaints</p>
				</div>
			</a>
			<a href="/help/complaints?filter=mine" class="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:bg-gray-50">
				<div class="rounded-lg bg-green-100 p-3">
					<User class="h-6 w-6 text-green-600" />
				</div>
				<div>
					<p class="font-medium text-gray-900">My Assignments</p>
					<p class="text-sm text-gray-500">Complaints assigned to you</p>
				</div>
			</a>
			<a href="/help/search" class="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:bg-gray-50">
				<div class="rounded-lg bg-purple-100 p-3">
					<Clock class="h-6 w-6 text-purple-600" />
				</div>
				<div>
					<p class="font-medium text-gray-900">Search Bookings</p>
					<p class="text-sm text-gray-500">Look up booking details</p>
				</div>
			</a>
		</div>
	</div>
</DashboardLayout>
