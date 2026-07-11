<script lang="ts">
	type TemplateKey = 'welcome' | 'verification' | 'passwordReset' | 'sessionSummary';

	let selectedTemplate = $state<TemplateKey>('welcome');

	const templates: Record<
		TemplateKey,
		{ name: string; subject: string; description: string; html: string }
	> = {
		welcome: {
			name: 'Welcome Email',
			subject: 'Welcome to AppGatePro Analytics',
			description: 'Sent when a new user signs up',
			html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, sans-serif; background: #faf8f5; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #f5a623; padding: 32px; text-align: center; }
        .logo { width: 60px; height: 60px; margin: 0 auto 16px; }
        .header h1 { color: #0a0809; margin: 0; font-size: 24px; }
        .content { padding: 32px; color: #1a1612; }
        .button { display: inline-block; background: #f5a623; color: #0a0809; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
        .footer { padding: 24px 32px; background: #faf8f5; text-align: center; color: #6b5f4d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="/logo-header-light.svg" alt="AppGatePro" style="height: 40px; margin: 0 auto 16px;" />
            <h1>Welcome to AppGatePro!</h1>
        </div>
        <div class="content">
            <p>Hi {{USER_NAME}},</p>
            <p>Welcome to AppGatePro Analytics! We're excited to help you track and improve your BMX performance.</p>
            <p>Get started by uploading your first training session from your AppGatePro device.</p>
            <a href="{{DASHBOARD_URL}}" class="button">Go to Dashboard</a>
            <p>If you have any questions, don't hesitate to reach out to our support team.</p>
            <p>Happy riding!<br>The AppGatePro Team</p>
        </div>
        <div class="footer">
            © 2026 JNS Pro Systems. All rights reserved.
        </div>
    </div>
</body>
</html>`
		},
		verification: {
			name: 'Email Verification',
			subject: 'Verify your email address',
			description: 'Sent to verify user email addresses',
			html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, sans-serif; background: #faf8f5; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #f5a623; padding: 32px; text-align: center; }
        .header h1 { color: #0a0809; margin: 0; font-size: 24px; }
        .content { padding: 32px; color: #1a1612; }
        .button { display: inline-block; background: #f5a623; color: #0a0809; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
        .code { background: #faf8f5; border: 2px dashed #e5dfd5; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1612; margin: 20px 0; }
        .footer { padding: 24px 32px; background: #faf8f5; text-align: center; color: #6b5f4d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="/logo-header-light.svg" alt="AppGatePro" style="height: 40px; margin: 0 auto 16px;" />
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <p>Hi {{USER_NAME}},</p>
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            <a href="{{VERIFICATION_URL}}" class="button">Verify Email Address</a>
            <p>Or use this verification code:</p>
            <div class="code">{{VERIFICATION_CODE}}</div>
            <p style="color: #6b5f4d; font-size: 14px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            © 2026 JNS Pro Systems. All rights reserved.
        </div>
    </div>
</body>
</html>`
		},
		passwordReset: {
			name: 'Password Reset',
			subject: 'Reset your password',
			description: 'Sent when user requests password reset',
			html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, sans-serif; background: #faf8f5; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #ff4444; padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .content { padding: 32px; color: #1a1612; }
        .button { display: inline-block; background: #ff4444; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0; color: #856404; }
        .footer { padding: 24px 32px; background: #faf8f5; text-align: center; color: #6b5f4d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="/logo-header-light.svg" alt="AppGatePro" style="height: 40px; margin: 0 auto 16px;" />
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi {{USER_NAME}},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="{{RESET_URL}}" class="button">Reset Password</a>
            <div class="warning">
                <strong>⚠️ Security Notice</strong><br>
                This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
            </div>
            <p style="color: #6b5f4d; font-size: 14px;">For security reasons, we never include your current password in emails.</p>
        </div>
        <div class="footer">
            © 2026 JNS Pro Systems. All rights reserved.
        </div>
    </div>
</body>
</html>`
		},
		sessionSummary: {
			name: 'Weekly Session Summary',
			subject: 'Your weekly training summary',
			description: 'Weekly digest of user activity (future feature)',
			html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, sans-serif; background: #faf8f5; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f5a623 0%, #ff6b3d 100%); padding: 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 32px; color: #1a1612; }
        .stat { background: #faf8f5; border-left: 4px solid #f5a623; padding: 16px; margin: 12px 0; }
        .stat-value { font-size: 32px; font-weight: bold; color: #f5a623; margin: 8px 0; }
        .button { display: inline-block; background: #f5a623; color: #0a0809; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
        .footer { padding: 24px 32px; background: #faf8f5; text-align: center; color: #6b5f4d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="/logo-header-light.svg" alt="AppGatePro" style="height: 40px; margin: 0 auto 16px;" />
            <h1>Your Weekly Summary</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">{{START_DATE}} - {{END_DATE}}</p>
        </div>
        <div class="content">
            <p>Hi {{USER_NAME}},</p>
            <p>Here's how you performed this week:</p>
            
            <div class="stat">
                <strong>Training Sessions</strong>
                <div class="stat-value">{{SESSION_COUNT}}</div>
                <small>Total runs: {{TOTAL_RUNS}}</small>
            </div>
            
            <div class="stat">
                <strong>Best Reaction Time</strong>
                <div class="stat-value">{{BEST_REACTION}}s</div>
                <small>{{IMPROVEMENT}}% improvement from last week</small>
            </div>
            
            <div class="stat">
                <strong>Peak Speed</strong>
                <div class="stat-value">{{PEAK_SPEED}} km/h</div>
                <small>New personal best! 🎉</small>
            </div>
            
            <p>Keep up the great work! Consistency is key to improvement.</p>
            <a href="{{ANALYTICS_URL}}" class="button">View Full Analytics</a>
        </div>
        <div class="footer">
            © 2026 JNS Pro Systems. All rights reserved.<br>
            <a href="{{UNSUBSCRIBE_URL}}" style="color: #6b5f4d;">Unsubscribe from weekly summaries</a>
        </div>
    </div>
</body>
</html>`
		}
	};

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		alert('Template HTML copied to clipboard!');
	}
</script>

<svelte:head>
	<title>Email Templates — AppGatePro Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h2 class="text-lg font-bold text-[#f0ece4]">Email Templates</h2>
		<p class="mt-0.5 text-sm text-[#9a8f7a]">Manage transactional email templates</p>
	</div>

	<!-- Info Banner -->
	<div class="rounded-xl border border-[#f5a623]/20 bg-[#131010] p-5">
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
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<div class="flex-1">
				<p class="mb-1 text-sm font-medium text-[#f0ece4]">Template Integration Required</p>
				<p class="text-xs text-[#9a8f7a]">
					These templates are examples. To use them in production, you'll need to integrate with
					Supabase Email Templates or a service like SendGrid, Postmark, or Resend.
				</p>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Template List -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
			<h3 class="mb-4 text-sm font-semibold text-[#f0ece4]">Templates</h3>
			<div class="space-y-2">
				{#each Object.entries(templates) as [key, template]}
					<button
						onclick={() => (selectedTemplate = key as TemplateKey)}
						class="w-full rounded-lg p-3 text-left transition-all
                               {selectedTemplate === key
							? 'border border-[#f5a623]/20 bg-[#f5a623]/10'
							: 'border border-transparent bg-[#0a0809] hover:border-[#221c18]'}"
					>
						<p
							class="text-sm font-medium {selectedTemplate === key
								? 'text-[#f5a623]'
								: 'text-[#f0ece4]'}"
						>
							{template.name}
						</p>
						<p class="mt-0.5 text-xs text-[#4a4038]">{template.description}</p>
					</button>
				{/each}
			</div>
		</div>

		<!-- Template Preview -->
		<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5 lg:col-span-2">
			{#if selectedTemplate}
				{@const template = templates[selectedTemplate]}
				<div class="mb-4 flex items-start justify-between">
					<div>
						<h3 class="text-sm font-semibold text-[#f0ece4]">{template.name}</h3>
						<p class="mt-0.5 text-xs text-[#9a8f7a]">Subject: {template.subject}</p>
					</div>
					<button
						onclick={() => copyToClipboard(template.html)}
						class="rounded-lg bg-[#f5a623] px-3 py-1.5 text-xs font-medium text-[#0a0809] transition-colors hover:bg-[#c97e0a]"
					>
						Copy HTML
					</button>
				</div>

				<!-- HTML Preview -->
				<div class="mb-4">
					<div class="mb-2 block text-xs font-medium text-[#9a8f7a]">HTML Code</div>
					<div class="max-h-96 overflow-auto rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
						<pre class="font-mono text-xs text-[#9a8f7a]">{template.html}</pre>
					</div>
				</div>

				<!-- Visual Preview -->
				<div>
					<div class="mb-2 block text-xs font-medium text-[#9a8f7a]">Visual Preview</div>
					<div class="overflow-hidden rounded-lg border border-[#221c18] bg-white">
						<iframe
							title="Email Preview"
							srcdoc={template.html}
							class="h-[500px] w-full border-0"
							sandbox="allow-same-origin"
						></iframe>
					</div>
				</div>

				<!-- Template Variables -->
				<div class="mt-4 rounded-lg bg-[#0a0809] p-4">
					<p class="mb-2 text-xs font-medium text-[#f0ece4]">Available Variables:</p>
					<div class="flex flex-wrap gap-2">
						{#each template.html.match(/\{\{[A-Z_]+\}\}/g) || [] as variable}
							<code
								class="rounded border border-[#221c18] bg-[#131010] px-2 py-1 text-xs text-[#f5a623]"
							>
								{variable}
							</code>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Integration Guide -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-5">
		<h3 class="mb-4 text-sm font-semibold text-[#f0ece4]">Integration Guide</h3>
		<div class="space-y-4">
			<div>
				<p class="mb-2 text-sm font-medium text-[#f0ece4]">1. Using Supabase Email Templates</p>
				<p class="mb-2 text-xs text-[#9a8f7a]">
					Configure in your Supabase project dashboard under Authentication → Email Templates
				</p>
				<pre
					class="overflow-x-auto rounded-lg border border-[#221c18] bg-[#0a0809] p-3 text-xs text-[#9a8f7a]">Dashboard → Authentication → Email Templates → Customize HTML</pre>
			</div>

			<div>
				<p class="mb-2 text-sm font-medium text-[#f0ece4]">2. Using a Third-Party Service</p>
				<p class="mb-2 text-xs text-[#9a8f7a]">
					For transactional emails (welcome, summaries), integrate Resend, SendGrid, or Postmark
				</p>
				<pre
					class="overflow-x-auto rounded-lg border border-[#221c18] bg-[#0a0809] p-3 text-xs text-[#9a8f7a]">npm install resend
// src/lib/server/email.ts
import {'{ Resend }'} from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);</pre>
			</div>

			<div>
				<p class="mb-2 text-sm font-medium text-[#f0ece4]">3. Testing Templates</p>
				<p class="text-xs text-[#9a8f7a]">
					Use <a href="https://mailtrap.io" target="_blank" class="text-[#f5a623] hover:underline"
						>Mailtrap</a
					>
					or
					<a href="https://ethereal.email" target="_blank" class="text-[#f5a623] hover:underline"
						>Ethereal</a
					> for testing emails in development
				</p>
			</div>
		</div>
	</div>
</div>
