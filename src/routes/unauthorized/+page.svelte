<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Unauthorized - Vehicle Rental</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
	<div class="max-w-md text-center">
		<div class="mb-6 text-6xl">🚫</div>
		<h1 class="mb-4 text-3xl font-bold text-gray-900">Access Denied</h1>
		<p class="mb-8 text-gray-600">
			You don't have permission to access this page. Please contact your administrator if you
			believe this is an error.
		</p>
		<div class="space-x-4">
			<button
				onclick={() => history.back()}
				class="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
			>
				Go Back
			</button>
			<a
				href="/"
				class="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
			>
				Go Home
			</a>
		</div>
	</div>
</div>
