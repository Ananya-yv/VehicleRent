<script lang="ts">
	import { DashboardLayout } from '$lib/components/layouts';
	import { StatsCard, DataTable, Badge, Button } from '$lib/components/ui';
	import { Car, Calendar, CreditCard, MessageSquare, Users, TrendingUp, AlertCircle } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const stats = [
		{ title: 'Total Vehicles', value: 24, icon: Car, color: 'blue' as const, trend: { value: 12, isPositive: true } },
		{ title: 'Active Bookings', value: 18, icon: Calendar, color: 'green' as const, trend: { value: 8, isPositive: true } },
		{ title: 'Total Revenue', value: '₹2.4L', icon: CreditCard, color: 'purple' as const, trend: { value: 15, isPositive: true } },
		{ title: 'Open Complaints', value: 5, icon: MessageSquare, color: 'red' as const, trend: { value: 3, isPositive: false } }
	];

	const recentBookings = [
		{ id: '1', customer: 'John Doe', vehicle: 'Toyota Camry', status: 'pending', date: '2024-01-15', amount: 2500 },
		{ id: '2', customer: 'Jane Smith', vehicle: 'Honda City', status: 'confirmed', date: '2024-01-14', amount: 1800 },
		{ id: '3', customer: 'Mike Wilson', vehicle: 'Mahindra Thar', status: 'delivered', date: '2024-01-13', amount: 3500 },
		{ id: '4', customer: 'Sarah Brown', vehicle: 'Hyundai Creta', status: 'returned', date: '2024-01-12', amount: 2800 }
	];

	const recentComplaints = [
		{ id: '1', customer: 'John Doe', issue: 'Vehicle not clean', priority: 'medium', status: 'pending' },
		{ id: '2', customer: 'Jane Smith', issue: 'Late delivery', priority: 'high', status: 'in_progress' },
		{ id: '3', customer: 'Mike Wilson', issue: 'Documentation issue', priority: 'low', status: 'resolved' }
	];

	const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
		pending: 'warning',
		confirmed: 'info',
		delivered: 'success',
		returned: 'success',
		cancelled: 'error',
		in_progress: 'info',
		resolved: 'success'
	};

	const priorityColors: Record<string, 'success' | 'warning' | 'error'> = {
		low: 'success',
		medium: 'warning',
		high: 'error'
	};
</script>

<svelte:head>
	<title>Admin Dashboard - Vehicle Rental</title>
</svelte:head>

<DashboardLayout
	role="admin"
	user={data.userProfile}
	title="Dashboard"
>
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat}
			<StatsCard
				title={stat.title}
				value={stat.value}
				icon={stat.icon}
				color={stat.color}
				trend={stat.trend}
			/>
		{/each}
	</div>

	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<div class="rounded-xl border bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Recent Bookings</h2>
				<a href="/admin/bookings" class="text-sm text-blue-600 hover:text-blue-700">View all →</a>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							<th class="pb-3">Customer</th>
							<th class="pb-3">Vehicle</th>
							<th class="pb-3">Status</th>
							<th class="pb-3 text-right">Amount</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each recentBookings as booking}
							<tr class="text-sm">
								<td class="py-3 font-medium text-gray-900">{booking.customer}</td>
								<td class="py-3 text-gray-600">{booking.vehicle}</td>
								<td class="py-3">
									<Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
								</td>
								<td class="py-3 text-right font-medium">₹{booking.amount}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="rounded-xl border bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Recent Complaints</h2>
				<a href="/admin/complaints" class="text-sm text-blue-600 hover:text-blue-700">View all →</a>
			</div>
			<div class="space-y-4">
				{#each recentComplaints as complaint}
					<div class="flex items-start justify-between rounded-lg border p-3">
						<div>
							<p class="font-medium text-gray-900">{complaint.customer}</p>
							<p class="text-sm text-gray-600">{complaint.issue}</p>
						</div>
						<div class="flex flex-col items-end gap-1">
							<Badge variant={priorityColors[complaint.priority]}>{complaint.priority}</Badge>
							<Badge variant={statusColors[complaint.status]}>{complaint.status.replace('_', ' ')}</Badge>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-8 grid gap-6 lg:grid-cols-3">
		<div class="rounded-xl border bg-white p-6 shadow-sm">
			<h3 class="mb-4 font-semibold text-gray-900">Quick Actions</h3>
			<div class="space-y-2">
				<a href="/admin/vehicles/new" class="flex w-full items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
					<Car class="h-5 w-5 text-blue-600" />
					<span class="text-sm font-medium">Add New Vehicle</span>
				</a>
				<a href="/admin/bookings" class="flex w-full items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
					<Calendar class="h-5 w-5 text-green-600" />
					<span class="text-sm font-medium">Manage Bookings</span>
				</a>
				<a href="/admin/users" class="flex w-full items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
					<Users class="h-5 w-5 text-purple-600" />
					<span class="text-sm font-medium">Manage Users</span>
				</a>
			</div>
		</div>

		<div class="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
			<h3 class="mb-4 font-semibold text-gray-900">Vehicle Availability</h3>
			<div class="grid grid-cols-3 gap-4 text-center">
				<div class="rounded-lg bg-green-50 p-4">
					<p class="text-2xl font-bold text-green-600">16</p>
					<p class="text-sm text-gray-600">Available</p>
				</div>
				<div class="rounded-lg bg-yellow-50 p-4">
					<p class="text-2xl font-bold text-yellow-600">6</p>
					<p class="text-sm text-gray-600">Booked</p>
				</div>
				<div class="rounded-lg bg-red-50 p-4">
					<p class="text-2xl font-bold text-red-600">2</p>
					<p class="text-sm text-gray-600">Maintenance</p>
				</div>
			</div>
		</div>
	</div>
</DashboardLayout>
