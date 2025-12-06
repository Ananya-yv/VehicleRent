<script lang="ts">
	import { toastStore, type Toast, type ToastType } from '$lib/stores/toast.svelte';
	import { X } from 'lucide-svelte';

	function getToastClasses(type: ToastType): string {
		switch (type) {
			case 'success':
				return 'bg-green-50 border-green-500 text-green-800';
			case 'error':
				return 'bg-red-50 border-red-500 text-red-800';
			case 'warning':
				return 'bg-yellow-50 border-yellow-500 text-yellow-800';
			case 'info':
			default:
				return 'bg-blue-50 border-blue-500 text-blue-800';
		}
	}

	function getIconClasses(type: ToastType): string {
		switch (type) {
			case 'success':
				return 'text-green-500';
			case 'error':
				return 'text-red-500';
			case 'warning':
				return 'text-yellow-500';
			case 'info':
			default:
				return 'text-blue-500';
		}
	}

	function getIcon(type: ToastType): string {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
			default:
				return 'ℹ';
		}
	}
</script>

<div class="pointer-events-none fixed right-0 top-0 z-50 p-4">
	<div class="space-y-2">
		{#each toastStore.toasts as toast (toast.id)}
			<div
				class="pointer-events-auto flex w-80 items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg {getToastClasses(toast.type)}"
				role="alert"
			>
				<span class="text-lg {getIconClasses(toast.type)}">
					{getIcon(toast.type)}
				</span>
				<p class="flex-1 text-sm font-medium">{toast.message}</p>
				<button
					onclick={() => toastStore.remove(toast.id)}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Dismiss"
				>
					<X size={16} />
				</button>
			</div>
		{/each}
	</div>
</div>
