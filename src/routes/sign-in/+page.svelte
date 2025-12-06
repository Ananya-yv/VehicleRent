<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getDashboardPath } from '$lib/auth';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { supabase } from '$lib/supabase';
	import type { UserRole } from '$lib/database.types';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let showPassword = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;

		try {
			const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (signInError) {
				toastStore.error(signInError.message);
				loading = false;
				return;
			}

			if (!authData.session || !authData.user) {
				toastStore.error('Invalid credentials');
				loading = false;
				return;
			}

			const isSecure = window.location.protocol === 'https:';
			const secureFlag = isSecure ? '; secure' : '';
			document.cookie = `sb-access-token=${authData.session.access_token}; path=/; max-age=3600${secureFlag}; samesite=lax`;
			document.cookie = `sb-refresh-token=${authData.session.refresh_token}; path=/; max-age=2592000${secureFlag}; samesite=lax`;

			const { data: profile, error: profileError } = await supabase
				.from('users')
				.select('role')
				.eq('id', authData.user.id)
				.single();

			if (profileError || !profile) {
				toastStore.error('User profile not found');
				loading = false;
				return;
			}

			toastStore.success('Signed in successfully!');

			const redirectTo = page.url.searchParams.get('redirect');
			const userRole = (profile as { role: UserRole }).role;
			if (redirectTo) {
				await goto(redirectTo);
			} else {
				const dashboardPath = getDashboardPath(userRole);
				await goto(dashboardPath);
			}
		} catch (err) {
			toastStore.error('An unexpected error occurred');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Vehicle Rental</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
				Sign in to your account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				For Admin, Delivery Agent, or Helpline Agent access
			</p>
		</div>

		<form class="mt-8 space-y-6" onsubmit={handleSubmit}>
			<div class="space-y-4 rounded-md shadow-sm">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
					<div class="relative mt-1">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							required
							bind:value={password}
							class="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
							placeholder="••••••••"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
						>
							{showPassword ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-between">
				<div class="text-sm">
					<a href="/forgot-password" class="font-medium text-blue-600 hover:text-blue-500">
						Forgot your password?
					</a>
				</div>
			</div>

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<svg
							class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Signing in...
					{:else}
						Sign in
					{/if}
				</button>
			</div>

			<div class="text-center text-sm">
				<span class="text-gray-600">Don't have an account?</span>
				<a href="/signup" class="ml-1 font-medium text-blue-600 hover:text-blue-500">Sign up</a>
			</div>
		</form>
	</div>
</div>
