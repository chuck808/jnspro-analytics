<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';

	interface Props {
		initialContent?: string;
		placeholder?: string;
		onChange?: (html: string) => void;
		editable?: boolean;
	}

	let {
		initialContent = '',
		placeholder = 'Start typing...',
		onChange = () => {},
		editable = true
	}: Props = $props();

	let editorElement: HTMLDivElement;
	let editor: Editor | null = $state(null);

	onMount(() => {
		editor = new Editor({
			element: editorElement,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3]
					}
				})
			],
			content: initialContent,
			editable,
			editorProps: {
				attributes: {
					class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3',
					style: 'color: #f0ece4;'
				}
			},
			onUpdate: ({ editor }) => {
				onChange(editor.getHTML());
			}
		});

		return () => {
			if (editor) {
				editor.destroy();
			}
		};
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	// Toolbar actions
	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	function toggleHeading(level: 1 | 2 | 3) {
		editor?.chain().focus().toggleHeading({ level }).run();
	}

	// Track active states using state instead of derived
	let isBold = $state(false);
	let isItalic = $state(false);
	let isBulletList = $state(false);
	let isOrderedList = $state(false);

	// Update active states when editor updates
	$effect(() => {
		if (editor) {
			isBold = editor.isActive('bold');
			isItalic = editor.isActive('italic');
			isBulletList = editor.isActive('bulletList');
			isOrderedList = editor.isActive('orderedList');
		}
	});
</script>

<div class="overflow-hidden rounded-lg border border-[#221c18] bg-[#0a0809]">
	{#if editable}
		<!-- Toolbar -->
		<div class="flex items-center gap-1 border-b border-[#221c18] bg-[#131010] px-2 py-2">
			<button
				onclick={toggleBold}
				type="button"
				class="rounded px-2 py-1 text-xs transition-colors
                       focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                       {isBold
					? 'bg-[#f5a623]/20 text-[#f5a623]'
					: 'text-[#9a8f7a] hover:bg-[#221c18]'}"
				title="Bold"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
					/>
				</svg>
			</button>

			<button
				onclick={toggleItalic}
				type="button"
				class="rounded px-2 py-1 text-xs transition-colors
                       focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                       {isItalic
					? 'bg-[#f5a623]/20 text-[#f5a623]'
					: 'text-[#9a8f7a] hover:bg-[#221c18]'}"
				title="Italic"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 20l4-16m-4 4h8m-8 8h8"
					/>
				</svg>
			</button>

			<div class="mx-1 h-4 w-px bg-[#221c18]"></div>

			<button
				onclick={toggleBulletList}
				type="button"
				class="rounded px-2 py-1 text-xs transition-colors
                       focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                       {isBulletList
					? 'bg-[#f5a623]/20 text-[#f5a623]'
					: 'text-[#9a8f7a] hover:bg-[#221c18]'}"
				title="Bullet list"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<button
				onclick={toggleOrderedList}
				type="button"
				class="rounded px-2 py-1 text-xs transition-colors
                       focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                       {isOrderedList
					? 'bg-[#f5a623]/20 text-[#f5a623]'
					: 'text-[#9a8f7a] hover:bg-[#221c18]'}"
				title="Numbered list"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 20l4-16m6 0l4 16M6 9h14M4 15h14"
					/>
				</svg>
			</button>

			<div class="mx-1 h-4 w-px bg-[#221c18]"></div>

			<button
				onclick={() => toggleHeading(2)}
				type="button"
				class="rounded px-2 py-1 text-xs font-semibold transition-colors
                       focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                       {editor?.isActive('heading', { level: 2 })
					? 'bg-[#f5a623]/20 text-[#f5a623]'
					: 'text-[#9a8f7a] hover:bg-[#221c18]'}"
				title="Heading"
			>
				H2
			</button>

			<button
				onclick={() => toggleHeading(3)}
				type="button"
				class="rounded px-2 py-1 text-xs font-semibold transition-colors
                       focus:ring-2 focus:ring-[#f5a623] focus:outline-none
                       {editor?.isActive('heading', { level: 3 })
					? 'bg-[#f5a623]/20 text-[#f5a623]'
					: 'text-[#9a8f7a] hover:bg-[#221c18]'}"
				title="Subheading"
			>
				H3
			</button>
		</div>
	{/if}

	<!-- Editor -->
	<div bind:this={editorElement} class="tiptap-editor" data-placeholder={placeholder}></div>
</div>

<style>
	:global(.tiptap-editor) {
		min-height: 120px;
		max-height: 400px;
		overflow-y: auto;
	}

	:global(.tiptap-editor p.is-editor-empty:first-child::before) {
		color: #6b5f4d;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	:global(.tiptap-editor h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		color: #f0ece4;
	}

	:global(.tiptap-editor h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 0.75rem;
		margin-bottom: 0.375rem;
		color: #f0ece4;
	}

	:global(.tiptap-editor h3) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: 0.5rem;
		margin-bottom: 0.25rem;
		color: #f0ece4;
	}

	:global(.tiptap-editor p) {
		margin-bottom: 0.5rem;
		color: #9a8f7a;
		line-height: 1.6;
	}

	:global(.tiptap-editor ul),
	:global(.tiptap-editor ol) {
		padding-left: 1.5rem;
		margin-bottom: 0.5rem;
		color: #9a8f7a;
	}

	:global(.tiptap-editor li) {
		margin-bottom: 0.25rem;
	}

	:global(.tiptap-editor strong) {
		font-weight: 600;
		color: #f0ece4;
	}

	:global(.tiptap-editor em) {
		font-style: italic;
	}

	:global(.tiptap-editor code) {
		background: #221c18;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-family: monospace;
		font-size: 0.875em;
		color: #f5a623;
	}

	:global(.tiptap-editor blockquote) {
		border-left: 3px solid #f5a623;
		padding-left: 1rem;
		margin-left: 0;
		margin-bottom: 0.5rem;
		color: #9a8f7a;
		font-style: italic;
	}
</style>
