<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onClose: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let { open, title, size = 'md', onClose, children, footer }: Props = $props();

	const sizes = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl'
	};

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full rounded-xl bg-white shadow-xl {sizes[size]}">
			{#if title}
				<div class="flex items-center justify-between border-b px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
					<button onclick={onClose} class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
						<X class="h-5 w-5" />
					</button>
				</div>
			{/if}

			<div class="px-6 py-4">
				{@render children()}
			</div>

			{#if footer}
				<div class="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
