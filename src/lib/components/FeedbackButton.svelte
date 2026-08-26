<script lang="ts">
	let isOpen = $state(false);
	let isSubmitting = $state(false);
	let isSuccess = $state(false);
	let formData = $state({
		type: 'bug',
		subject: '',
		description: '',
		email: ''
	});

	function openModal() {
		isOpen = true;
		isSuccess = false;
	}

	function closeModal() {
		isOpen = false;
		if (isSuccess) {
			formData = {
				type: 'bug',
				subject: '',
				description: '',
				email: ''
			};
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		try {
			const response = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				isSuccess = true;
				setTimeout(() => {
					closeModal();
				}, 2000);
			} else {
				alert('Failed to submit feedback. Please try again or contact support directly.');
			}
		} catch {
			alert('Failed to submit feedback. Please try again or contact support directly.');
		} finally {
			isSubmitting = false;
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<!-- Floating Button -->
<button class="feedback-btn" onclick={openModal} title="Report an issue or send feedback">
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
		/>
	</svg>
</button>

<!-- Modal -->
{#if isOpen}
	<div class="modal-backdrop" onclick={handleBackdropClick}>
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="feedback-modal-title"
			tabindex="-1"
			use:focusOnMount
		>
			{#if !isSuccess}
				<div class="modal-header">
					<div>
						<h2 id="feedback-modal-title" class="modal-title">Report an Issue</h2>
						<p class="modal-subtitle">Help us improve AppGatePro during beta testing</p>
					</div>
					<button class="close-btn" onclick={closeModal} aria-label="Close modal">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<form class="modal-body" onsubmit={handleSubmit}>
					<div class="form-group">
						<label for="type">Type</label>
						<select id="type" bind:value={formData.type} required>
							<option value="bug">🐛 Bug Report</option>
							<option value="feature">💡 Feature Request</option>
							<option value="feedback">💬 General Feedback</option>
							<option value="question">❓ Question</option>
						</select>
					</div>

					<div class="form-group">
						<label for="subject">Subject</label>
						<input
							id="subject"
							type="text"
							placeholder="Brief description of the issue"
							bind:value={formData.subject}
							required
						/>
					</div>

					<div class="form-group">
						<label for="description">Details</label>
						<textarea
							id="description"
							rows="5"
							placeholder="Please provide as much detail as possible..."
							bind:value={formData.description}
							required
						></textarea>
					</div>

					<div class="form-group">
						<label for="email">Your Email (optional)</label>
						<input
							id="email"
							type="email"
							placeholder="your@email.com"
							bind:value={formData.email}
						/>
						<p class="form-hint">We'll only use this to follow up on your report</p>
					</div>

					<div class="modal-actions">
						<button
							type="button"
							class="btn-secondary"
							onclick={closeModal}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button type="submit" class="btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}
								<span class="spinner"></span>
								Sending...
							{:else}
								Send Feedback
							{/if}
						</button>
					</div>
				</form>
			{:else}
				<div class="success-message">
					<div class="success-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h3>Thank you!</h3>
					<p>Your feedback has been received. We appreciate you helping us improve AppGatePro.</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.feedback-btn {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 90;
		width: 56px;
		height: 56px;
		background: #f5a623;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 4px 12px rgba(245, 166, 35, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
	}

	.feedback-btn:hover {
		background: #c97e0a;
		transform: translateY(-2px);
		box-shadow:
			0 6px 16px rgba(245, 166, 35, 0.4),
			0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.feedback-btn svg {
		width: 28px;
		height: 28px;
		color: #0a0809;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(8, 7, 7, 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: #131010;
		border: 1px solid rgba(245, 166, 35, 0.2);
		border-radius: 16px;
		width: 100%;
		max-width: 540px;
		max-height: 90vh;
		overflow-y: auto;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 2rem 2rem 1.5rem;
		border-bottom: 1px solid rgba(245, 166, 35, 0.1);
	}

	.modal-title {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 800;
		font-size: 1.5rem;
		color: #f0ece4;
		margin: 0 0 0.25rem;
	}

	.modal-subtitle {
		font-size: 0.875rem;
		color: #9a8f7a;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border-radius: 6px;
		transition: background 0.2s;
		flex-shrink: 0;
	}

	.close-btn svg {
		width: 20px;
		height: 20px;
		color: #9a8f7a;
	}

	.close-btn:hover {
		background: rgba(245, 166, 35, 0.1);
	}

	.modal-body {
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group:last-of-type {
		margin-bottom: 2rem;
	}

	label {
		display: block;
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 0.875rem;
		color: #f0ece4;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	select,
	input,
	textarea {
		width: 100%;
		background: #0a0809;
		border: 1px solid rgba(245, 166, 35, 0.2);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		font-family: 'Barlow', sans-serif;
		font-size: 0.875rem;
		color: #f0ece4;
		transition: border-color 0.2s;
	}

	select:focus,
	input:focus,
	textarea:focus {
		outline: none;
		border-color: #f5a623;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}

	.form-hint {
		font-size: 0.75rem;
		color: #6a5f4f;
		margin: 0.5rem 0 0;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 700;
		font-size: 0.875rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: #f5a623;
		color: #0a0809;
	}

	.btn-primary:hover:not(:disabled) {
		background: #c97e0a;
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid rgba(245, 166, 35, 0.2);
		color: #f0ece4;
	}

	.btn-secondary:hover:not(:disabled) {
		border-color: #f5a623;
		color: #f5a623;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(10, 8, 9, 0.3);
		border-top-color: #0a0809;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.success-message {
		padding: 3rem 2rem;
		text-align: center;
	}

	.success-icon {
		width: 64px;
		height: 64px;
		background: rgba(61, 232, 200, 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
	}

	.success-icon svg {
		width: 32px;
		height: 32px;
		color: #3de8c8;
		stroke-width: 3;
	}

	.success-message h3 {
		font-family: 'Barlow Condensed', sans-serif;
		font-weight: 800;
		font-size: 1.5rem;
		color: #f0ece4;
		margin: 0 0 0.5rem;
	}

	.success-message p {
		font-size: 0.875rem;
		color: #9a8f7a;
		margin: 0;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.feedback-btn {
			bottom: 1rem;
			right: 1rem;
			width: 48px;
			height: 48px;
		}

		.feedback-btn svg {
			width: 24px;
			height: 24px;
		}

		.modal-header,
		.modal-body {
			padding: 1.5rem;
		}

		.modal-actions {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
			justify-content: center;
		}
	}
</style>
