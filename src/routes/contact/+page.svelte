<script lang="ts">
    import { enhance } from '$app/forms';
    
    let submitting = $state(false);
    let submitted = $state(false);
</script>

<svelte:head>
    <title>Contact Us — AppGatePro Analytics</title>
    <meta name="description" content="Get in touch with the AppGatePro team. We're here to help with questions, support, and feedback." />
</svelte:head>

<div class="min-h-screen bg-[#0a0809] text-[#f0ece4]">
    <div class="max-w-3xl mx-auto px-6 py-12">
        
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-[#f5a623] mb-3">Get in Touch</h1>
            <p class="text-lg text-[#9a8f7a]">
                Have questions, feedback, or need support? We're here to help.
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            
            <!-- Contact Info -->
            <div class="space-y-6">
                <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
                    <h2 class="text-xl font-bold text-[#f0ece4] mb-4">Contact Information</h2>
                    
                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            <div>
                                <p class="text-sm font-semibold text-[#f0ece4]">Email</p>
                                <a href="mailto:support@jnsprosystems.com" class="text-sm text-[#9a8f7a] hover:text-[#f5a623] transition-colors">
                                    support@jnsprosystems.com
                                </a>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <div>
                                <p class="text-sm font-semibold text-[#f0ece4]">Response Time</p>
                                <p class="text-sm text-[#9a8f7a]">
                                    Within 24-48 hours
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#f5a623] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <div>
                                <p class="text-sm font-semibold text-[#f0ece4]">Location</p>
                                <p class="text-sm text-[#9a8f7a]">
                                    United Kingdom
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
                    <h2 class="text-lg font-bold text-[#f0ece4] mb-3">Support Resources</h2>
                    <div class="space-y-2">
                        <a href="/about" class="block text-sm text-[#9a8f7a] hover:text-[#f5a623] transition-colors">
                            → About AppGatePro
                        </a>
                        <a href="/privacy" class="block text-sm text-[#9a8f7a] hover:text-[#f5a623] transition-colors">
                            → Privacy Policy
                        </a>
                        <a href="/terms" class="block text-sm text-[#9a8f7a] hover:text-[#f5a623] transition-colors">
                            → Terms of Service
                        </a>
                    </div>
                </div>
            </div>

            <!-- Contact Form -->
            <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
                {#if submitted}
                    <div class="text-center py-12">
                        <div class="w-16 h-16 bg-[#3de8c8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-[#3de8c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-[#f0ece4] mb-2">Message Sent!</h3>
                        <p class="text-sm text-[#9a8f7a] mb-6">
                            Thank you for reaching out. We'll get back to you soon.
                        </p>
                        <button
                            onclick={() => submitted = false}
                            class="text-sm text-[#f5a623] hover:text-[#c97e0a] transition-colors">
                            Send another message
                        </button>
                    </div>
                {:else}
                    <h2 class="text-xl font-bold text-[#f0ece4] mb-4">Send a Message</h2>
                    
                    <form 
                        method="POST"
                        use:enhance={() => {
                            submitting = true;
                            return async ({ result }) => {
                                submitting = false;
                                if (result.type === 'success') {
                                    submitted = true;
                                }
                            };
                        }}
                        class="space-y-4">
                        
                        <div>
                            <label for="name" class="block text-sm font-medium text-[#9a8f7a] mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg
                                       text-[#f0ece4] placeholder-[#4a4038]
                                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623]
                                       transition-colors"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-[#9a8f7a] mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg
                                       text-[#f0ece4] placeholder-[#4a4038]
                                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623]
                                       transition-colors"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label for="subject" class="block text-sm font-medium text-[#9a8f7a] mb-2">
                                Subject *
                            </label>
                            <select
                                id="subject"
                                name="subject"
                                required
                                class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg
                                       text-[#f0ece4]
                                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623]
                                       transition-colors">
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
                            <label for="message" class="block text-sm font-medium text-[#9a8f7a] mb-2">
                                Message *
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                required
                                rows="6"
                                class="w-full px-4 py-2.5 bg-[#0a0809] border border-[#221c18] rounded-lg
                                       text-[#f0ece4] placeholder-[#4a4038]
                                       focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-[#f5a623]
                                       transition-colors resize-none"
                                placeholder="Tell us how we can help..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            class="w-full px-6 py-3 bg-[#f5a623] hover:bg-[#c97e0a]
                                   text-[#0a0809] font-semibold rounded-lg transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#131010]
                                   disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? 'Sending...' : 'Send Message'}
                        </button>

                        <p class="text-xs text-[#6b5f4d] text-center">
                            Note: This is a demo form. In production, integrate with an email service or contact form backend.
                        </p>
                    </form>
                {/if}
            </div>

        </div>

        <!-- Footer -->
        <div class="border-t border-[#221c18] pt-6 text-center">
            <div class="flex justify-center gap-6 text-sm">
                <a href="/" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">Home</a>
                <a href="/about" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">About</a>
                <a href="/privacy" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">Privacy</a>
                <a href="/terms" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">Terms</a>
            </div>
            <p class="text-xs text-[#6b5f4d] mt-4">
                © 2026 JNS Pro Systems. All rights reserved.
            </p>
        </div>

    </div>
</div>
