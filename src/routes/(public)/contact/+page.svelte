<script lang="ts">
	let submitting = $state(false);
	let submitted = $state(false);
	let submitError = $state('');

	const subjectLabels: Record<string, string> = {
		support: 'Technical Support',
		device: 'Device Hardware',
		billing: 'Billing & Accounts',
		feature: 'Feature Request',
		bug: 'Bug Report',
		other: 'Other'
	};

	const feedbackTypes: Record<string, 'bug' | 'feature' | 'feedback' | 'question'> = {
		support: 'question',
		device: 'question',
		billing: 'question',
		feature: 'feature',
		bug: 'bug',
		other: 'feedback'
	};

	async function submitContact(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		submitError = '';

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const subjectKey = String(formData.get('subject') ?? '');
		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim();
		const message = String(formData.get('message') ?? '').trim();

		try {
			const response = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: feedbackTypes[subjectKey] ?? 'feedback',
					subject: `Contact: ${subjectLabels[subjectKey] ?? 'Other'}`,
					description: name ? `${message}\n\nFrom: ${name}` : message,
					email
				})
			});

			if (!response.ok) {
				throw new Error('Contact submission failed');
			}

			submitted = true;
			form.reset();
		} catch {
			submitError =
				'Your message could not be sent. Please try again or email support@jnsprosystems.com directly.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Contact Us — AppGatePro Analytics</title>
	<meta
		name="description"
		content="Get in touch with the AppGatePro team. We're here to help with questions, support, and feedback."
	/>
</svelte:head>

<div class="min-h-screen bg-[#0a0809] text-[#f0ece4]">
	<div class="mx-auto max-w-3xl px-6 py-12">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-3 text-4xl font-bold text-[#f5a623]">Get in Touch</h1>
			<p class="text-lg text-[#9a8f7a]">
				Have questions, feedback, or need support? We're here to help.
			</p>
		</div>

		<div class="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
			<!-- Contact Info -->
			<div class="space-y-6">
				<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
					<h2 class="mb-4 text-xl font-bold text-[#f0ece4]">Contact Information</h2>

					<div class="space-y-4">
						<div class="flex items-start gap-3">
							<svg
								class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							<div>
								<p class="text-sm font-semibold text-[#f0ece4]">Email</p>
								<a
									href="mailto:support@jnsprosystems.com"
									class="text-sm text-[#9a8f7a] transition-colors hover:text-[#f5a623]"
								>
									support@jnsprosystems.com
								</a>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<svg
								class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<div>
								<p class="text-sm font-semibold text-[#f0ece4]">Support</p>
								<p class="text-sm text-[#9a8f7a]">Messages are reviewed by the AppGatePro team</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<svg
								class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#f5a623]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							<div>
								<p class="text-sm font-semibold text-[#f0ece4]">Location</p>
								<p class="text-sm text-[#9a8f7a]">United Kingdom</p>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
					<h2 class="mb-3 text-lg font-bold text-[#f0ece4]">Support Resources</h2>
					<div class="space-y-2">
						<a
							href="/about"
							class="block text-sm text-[#9a8f7a] transition-colors hover:text-[#f5a623]"
						>
							→ About AppGatePro
						</a>
						<a
							href="/privacy"
							class="block text-sm text-[#9a8f7a] transition-colors hover:text-[#f5a623]"
						>
							→ Privacy Policy
						</a>
						<a
							href="/terms"
							class="block text-sm text-[#9a8f7a] transition-colors hover:text-[#f5a623]"
						>
							→ Terms of Service
						</a>
					</div>
				</div>
			</div>

			<!-- Contact Form -->
			<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
				{#if submitted}
					<div class="py-12 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#3de8c8]/10"
						>
							<svg
								class="h-8 w-8 text-[#3de8c8]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h3 class="mb-2 text-lg font-bold text-[#f0ece4]">Message Sent</h3>
						<p class="mb-6 text-sm text-[#9a8f7a]">
							Your message has been added to the support inbox for review.
						</p>
						<button
							onclick={() => (submitted = false)}
							class="text-sm text-[#f5a623] transition-colors hover:text-[#c97e0a]"
						>
							Send another message
						</button>
					</div>
				{:else}
					<h2 class="mb-4 text-xl font-bold text-[#f0ece4]">Send a Message</h2>

					<form onsubmit={submitContact} class="space-y-4">
						<div>
							<label for="name" class="mb-2 block text-sm font-medium text-[#9a8f7a]">
								Name *
							</label>
							<input
								type="text"
								id="name"
								name="name"
								required
								class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5
                                       text-[#f0ece4] placeholder-[#4a4038]
                                       transition-colors focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]
                                       focus:outline-none"
								placeholder="Your name"
							/>
						</div>

						<div>
							<label for="email" class="mb-2 block text-sm font-medium text-[#9a8f7a]">
								Email *
							</label>
							<input
								type="email"
								id="email"
								name="email"
								required
								class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5
                                       text-[#f0ece4] placeholder-[#4a4038]
                                       transition-colors focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]
                                       focus:outline-none"
								placeholder="your@email.com"
							/>
						</div>

						<div>
							<label for="subject" class="mb-2 block text-sm font-medium text-[#9a8f7a]">
								Subject *
							</label>
							<select
								id="subject"
								name="subject"
								required
								class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5
                                       text-[#f0ece4]
                                       transition-colors focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]
                                       focus:outline-none"
							>
								<option value="">Select a topic...</option>
								<option value="support">Technical Support</option>
								<option value="device">Device Hardware</option>
								<option value="billing">Billing & Accounts</option>
								<option value="feature">Feature Request</option>
								<option value="bug">Bug Report</option>
								<option value="other">Other</option>
							</select>
						</div>

						<div>
							<label for="message" class="mb-2 block text-sm font-medium text-[#9a8f7a]">
								Message *
							</label>
							<textarea
								id="message"
								name="message"
								required
								rows="6"
								class="w-full resize-none rounded-lg border border-[#221c18] bg-[#0a0809] px-4
                                       py-2.5 text-[#f0ece4]
                                       placeholder-[#4a4038] transition-colors focus:border-[#f5a623] focus:ring-2
                                       focus:ring-[#f5a623] focus:outline-none"
								placeholder="Tell us how we can help..."
							></textarea>
						</div>

						{#if submitError}
							<p class="rounded-lg border border-[#ff6b3d]/30 bg-[#ff6b3d]/10 p-3 text-sm text-[#ff8f6b]">
								{submitError}
							</p>
						{/if}

						<button
							type="submit"
							disabled={submitting}
							class="w-full rounded-lg bg-[#f5a623] px-6 py-3
                                   font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]
                                   focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#131010] focus:outline-none
                                   disabled:cursor-not-allowed disabled:opacity-50"
						>
							{submitting ? 'Sending...' : 'Send Message'}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>