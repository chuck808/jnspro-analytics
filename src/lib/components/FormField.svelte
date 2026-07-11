<script lang="ts">
	import type { ValidationRule } from '$lib/utils/validation';
	import { validate } from '$lib/utils/validation';

	let {
		label,
		id,
		type = 'text',
		value = $bindable(''),
		rules = [],
		helpText,
		required = false,
		placeholder,
		disabled = false
	}: {
		label: string;
		id: string;
		type?: string;
		value?: any;
		rules?: ValidationRule<any>[];
		helpText?: string;
		required?: boolean;
		placeholder?: string;
		disabled?: boolean;
	} = $props();

	let touched = $state(false);
	let error = $state<string | null>(null);

	function handleBlur() {
		touched = true;
		error = validate(value, rules);
	}

	function handleInput() {
		if (touched) {
			error = validate(value, rules);
		}
	}
</script>

<div>
	<label for={id} class="mb-1 block text-sm text-[#f0ece4]">
		{label}
		{#if required}
			<span class="text-[#ff4444]">*</span>
		{/if}
	</label>

	<input
		{id}
		{type}
		{placeholder}
		{disabled}
		bind:value
		onblur={handleBlur}
		oninput={handleInput}
		aria-describedby="{helpText ? `${id}-help` : ''} {error ? `${id}-error` : ''}"
		aria-invalid={error !== null}
		aria-required={required}
		class="w-full rounded-lg border bg-[#0a0809] px-3 py-2 text-[#f0ece4]
               transition-colors focus:ring-2 focus:ring-[#f5a623] focus:outline-none
               disabled:cursor-not-allowed disabled:opacity-50
               {error ? 'border-[#ff4444]' : 'border-[#221c18]'}"
	/>

	{#if helpText && !error}
		<p id="{id}-help" class="mt-1 text-xs text-[#6b5f4d]">
			{helpText}
		</p>
	{/if}

	{#if error}
		<p id="{id}-error" class="mt-1 text-xs text-[#ff4444]" role="alert">
			{error}
		</p>
	{/if}
</div>
