<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let accountSaving = $state(false);
	let passwordSaving = $state(false);
	let notificationsSaving = $state(false);
	let preferencesSaving = $state(false);
	let showDeleteConfirm = $state(false);
	let linkStatus: 'idle' | 'linking' | 'success' | 'error' = $state('idle');
	let linkError = $state('');
	let coachSaving = $state(false);
	let coachAppSaving = $state(false);

	// Editable form fields — bind:-backed local state, synced from `data` via
	// $effect. Previously these fields used one-way `value=`/`checked=`
	// bindings, which Svelte 5 silently reset back to their loaded default
	// whenever any onsubmit handler on the page flipped a $state variable —
	// discarding the user's edit before the browser read the form. Same bug
	// class fixed on the profile page; see that file's script block for the
	// full root-cause explanation.
	let accountEmail = $state('');
	let notificationPrefs = $state({ email_alerts: false, progress_reports: false });
	let showDecimal = $state(false);
	let coachClub = $state('');
	let coachQualificationDetails = $state('');

	$effect(() => {
		accountEmail = data.profile?.email ?? '';
		notificationPrefs = {
			email_alerts: data.preferences?.email_alerts ?? false,
			progress_reports: data.preferences?.progress_reports ?? false
		};
		showDecimal = data.preferences?.show_decimal ?? false;
		coachClub = data.profile?.club ?? '';
		coachQualificationDetails = data.latestCoachApplication?.qualification_details ?? '';
	});

	function successFor(key: string) {
		return (form as any)?.[key] === true;
	}
	function errorFor(key: string) {
		return (form as any)?.[key] as string | undefined;
	}

	async function linkDevice() {
		linkStatus = 'linking';
		linkError = '';

		try {
			// Get device credentials from server
			const formData = new FormData();
			const response = await fetch('?/generateDeviceToken', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});

			const result = await response.json();
			const parsed = JSON.parse(result.data);
			const credentials = {
				device_id: parsed[2],
				device_secret: parsed[3]
			};

			if (!credentials?.device_id || !credentials?.device_secret) {
				throw new Error('Failed to retrieve device credentials');
			}

			// Open serial port
			const port = await navigator.serial.requestPort();
			await port.open({
				baudRate: 115200,
				dataBits: 8,
				stopBits: 1,
				parity: 'none',
				flowControl: 'none'
			});
			await port.setSignals({ dataTerminalReady: false, requestToSend: false });
			await new Promise((resolve) => setTimeout(resolve, 500));

			const writer = port.writable.getWriter();
			const encoder = new TextEncoder();

			const payload = JSON.stringify({
				device_id: credentials.device_id,
				device_secret: credentials.device_secret
			});

			await writer.write(encoder.encode(`PROVISION:${payload}\n`));
			writer.releaseLock();

			// Wait for PROVISION_OK
			const reader = port.readable.getReader();
			const decoder = new TextDecoder();
			let responseStr = '';
			const timeout = Date.now() + 30000;

			while (Date.now() < timeout) {
				const { value, done } = await reader.read();
				if (done) break;
				responseStr += decoder.decode(value);
				if (responseStr.includes('PROVISION_OK')) {
					reader.releaseLock();
					await port.close();
					linkStatus = 'success';
					return;
				}
				if (responseStr.includes('PROVISION_ERR')) {
					const errLine = responseStr.split('\n').find((l) => l.includes('PROVISION_ERR'));
					throw new Error(errLine ?? 'Device rejected provisioning payload');
				}
			}

			reader.releaseLock();
			await port.close();
			throw new Error('Device did not respond in time');
		} catch (err: any) {
			if (err?.name === 'NotFoundError') {
				linkStatus = 'idle';
				return;
			}
			linkError = err?.message ?? 'Unknown error during linking';
			linkStatus = 'error';
		}
	}
</script>

<svelte:head>
	<title>Settings — AppGatePro</title>
</svelte:head>

<!-- Page header -->
<div class="mb-8">
	<h1 class="themed-text-primary text-3xl font-bold">Settings</h1>
	<p class="themed-text-secondary mt-2 text-sm">
		Manage your account, notifications, and application preferences
	</p>
</div>

<!-- Full-width grid layout -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
	<!-- Account & Security -->
	<div class="themed-card rounded-xl p-6">
		<h2 class="themed-text-primary mb-1 text-lg font-semibold">Account & Security</h2>
		<p class="themed-text-secondary mb-6 text-xs">Update your email address and password</p>

		<!-- Update Email -->
		<div class="mb-8">
			<h3 class="mb-4 text-sm font-medium text-[#f0ece4]">Email Address</h3>

			{#if successFor('accountSuccess')}
				<div
					class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
				>
					Email updated — check your inbox to verify your new address.
				</div>
			{/if}
			{#if errorFor('accountError')}
				<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
					{errorFor('accountError')}
				</div>
			{/if}

			<form
				method="POST"
				action="?/updateAccount"
				onsubmit={() => (accountSaving = true)}
				class="space-y-4"
			>
				<div>
					<label for="email" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
						Email address
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						bind:value={accountEmail}
						class="input-field w-full"
					/>
					<p class="mt-1 text-xs text-[#6b5f4d]">Changing your email will require verification</p>
				</div>
				<button type="submit" disabled={accountSaving} class="btn-primary">
					{accountSaving ? 'Updating...' : 'Update email'}
				</button>
			</form>
		</div>

		<!-- Change Password -->
		<div class="border-t border-[#221c18] pt-6">
			<h3 class="mb-4 text-sm font-medium text-[#f0ece4]">Change Password</h3>

			{#if successFor('passwordSuccess')}
				<div
					class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
				>
					Password updated successfully
				</div>
			{/if}
			{#if errorFor('passwordError')}
				<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
					{errorFor('passwordError')}
				</div>
			{/if}

			<form
				method="POST"
				action="?/updatePassword"
				onsubmit={() => (passwordSaving = true)}
				class="space-y-4"
			>
				<div>
					<label for="newPassword" class="mb-1.5 block text-xs font-medium text-[#9a8f7a]">
						New password
					</label>
					<input
						id="newPassword"
						name="newPassword"
						type="password"
						minlength="8"
						required
						class="input-field w-full"
						autocomplete="new-password"
					/>
					<p class="mt-1 text-xs text-[#6b5f4d]">Minimum 8 characters</p>
				</div>
				<button type="submit" disabled={passwordSaving} class="btn-primary">
					{passwordSaving ? 'Updating...' : 'Change password'}
				</button>
			</form>
		</div>
	</div>

	<!-- Notifications -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h2 class="mb-1 text-lg font-semibold text-[#f0ece4]">Notifications & Alerts</h2>
		<p class="mb-6 text-xs text-[#9a8f7a]">Control which emails you receive from us</p>

		{#if successFor('notificationsSuccess')}
			<div
				class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
			>
				Notification preferences saved
			</div>
		{/if}
		{#if errorFor('notificationsError')}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
				{errorFor('notificationsError')}
			</div>
		{/if}

		<form
			method="POST"
			action="?/updateNotifications"
			onsubmit={() => (notificationsSaving = true)}
			class="space-y-4"
		>
			<div class="space-y-3">
				{#each [{ id: 'email_alerts', name: 'email_alerts' as const, label: 'Email Alerts', desc: 'Receive emails about important updates and features' }, { id: 'progress_reports', name: 'progress_reports' as const, label: 'Progress Reports', desc: 'Weekly or monthly summaries of your performance data' }] as pref}
					<div
						class="flex min-h-[44px] items-start gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4"
					>
						<input
							type="checkbox"
							id={pref.id}
							name={pref.name}
							value="true"
							bind:checked={notificationPrefs[pref.name]}
							class="mt-0.5 accent-[#f5a623]"
						/>
						<div class="flex-1">
							<label for={pref.id} class="cursor-pointer text-sm font-medium text-[#f0ece4]">
								{pref.label}
							</label>
							<p class="mt-0.5 text-xs text-[#6b5f4d]">{pref.desc}</p>
						</div>
					</div>
				{/each}
			</div>

			<button type="submit" disabled={notificationsSaving} class="btn-primary">
				{notificationsSaving ? 'Saving...' : 'Save notification preferences'}
			</button>
		</form>
	</div>

	<!-- Display Preferences -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h2 class="mb-1 text-lg font-semibold text-[#f0ece4]">Display Preferences</h2>
		<p class="mb-6 text-xs text-[#9a8f7a]">Customize how data is displayed in the app</p>

		{#if successFor('preferencesSuccess')}
			<div
				class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
			>
				Preferences saved
			</div>
		{/if}
		{#if errorFor('preferencesError')}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
				{errorFor('preferencesError')}
			</div>
		{/if}

		<form
			method="POST"
			action="?/updatePreferences"
			onsubmit={() => (preferencesSaving = true)}
			class="space-y-4"
		>
			<div
				class="flex min-h-[44px] items-start gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4"
			>
				<input
					type="checkbox"
					id="show_decimal"
					name="show_decimal"
					value="true"
					bind:checked={showDecimal}
					class="mt-0.5 accent-[#f5a623]"
				/>
				<div class="flex-1">
					<label for="show_decimal" class="cursor-pointer text-sm font-medium text-[#f0ece4]">
						Show decimal places
					</label>
					<p class="mt-0.5 text-xs text-[#6b5f4d]">
						Display extra precision in analytics (e.g. 0.285s vs 0.29s)
					</p>
				</div>
			</div>

			<button type="submit" disabled={preferencesSaving} class="btn-primary">
				{preferencesSaving ? 'Saving...' : 'Save preferences'}
			</button>
		</form>
	</div>

	<!-- Leaderboard & Privacy -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h2 class="mb-1 text-lg font-semibold text-[#f0ece4]">Leaderboard & Competition</h2>
		<p class="mb-6 text-xs text-[#9a8f7a]">
			Compete with riders worldwide while protecting your privacy
		</p>

		{#if successFor('leaderboardSuccess')}
			<div
				class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
			>
				Leaderboard preferences saved
			</div>
		{/if}
		{#if errorFor('leaderboardError')}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
				{errorFor('leaderboardError')}
			</div>
		{/if}

		<form method="POST" action="?/updateLeaderboard" class="space-y-4">
			<div
				class="flex min-h-[44px] items-start gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4"
			>
				<input
					type="checkbox"
					id="show_on_leaderboard"
					name="show_on_leaderboard"
					value="true"
					checked={data.preferences?.show_on_leaderboard}
					class="mt-0.5 accent-[#f5a623]"
				/>
				<div class="flex-1">
					<label
						for="show_on_leaderboard"
						class="cursor-pointer text-sm font-medium text-[#f0ece4]"
					>
						Show on Leaderboard
					</label>
					<p class="mt-0.5 text-xs text-[#6b5f4d]">
						Share your best performances anonymously and see how you rank against other riders
					</p>
				</div>
			</div>

			<div>
				<label
					for="leaderboard_display_name"
					class="mb-1.5 block text-xs font-medium text-[#9a8f7a]"
				>
					Display Name <span class="font-normal text-[#6b5f4d]">(shown on leaderboard)</span>
				</label>
				<input
					id="leaderboard_display_name"
					name="leaderboard_display_name"
					type="text"
					value={data.preferences?.leaderboard_display_name ?? ''}
					class="input-field w-full"
					placeholder="e.g. SpeedRider247 (leave blank for auto-generated)"
				/>
				<p class="mt-1 text-xs text-[#6b5f4d]">
					Your real name is never shown. Choose an anonymous name or we'll generate one for you.
				</p>
			</div>

			<button type="submit" class="btn-primary"> Save leaderboard preferences </button>
		</form>

		<div class="mt-4 border-t border-[#221c18] pt-4">
			<a
				href="/leaderboard"
				class="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#f5a623]/10 px-5
                      py-2.5 text-sm font-medium text-[#f5a623] transition-colors hover:bg-[#f5a623]/20
                      focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
					/>
				</svg>
				View Leaderboard →
			</a>
		</div>
	</div>

	<!-- Training Goals link -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h2 class="mb-1 text-lg font-semibold text-[#f0ece4]">Training Goals</h2>
		<p class="mb-4 text-xs text-[#9a8f7a]">
			Set performance targets and track your progress over time
		</p>
		<a
			href="/goals"
			class="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#221c18] px-5
                  py-2.5 text-sm font-medium text-[#f0ece4] transition-colors hover:bg-[#2a221d]
                  focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
		>
			<svg class="h-4 w-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
				/>
			</svg>
			Manage training goals →
		</a>
	</div>

	<!-- Device Linking (USB) -->
	<div class="rounded-xl border border-[#221c18] bg-[#131010] p-6">
		<h2 class="mb-1 text-lg font-semibold text-[#f0ece4]">Link Device</h2>
		<p class="mb-6 text-xs text-[#9a8f7a]">
			Connect your AppGatePro device via USB to provision credentials
		</p>

		{#if linkStatus === 'success'}
			<div
				class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
			>
				✓ Device linked successfully! Your device can now upload data.
			</div>
		{/if}
		{#if linkStatus === 'error' && linkError}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
				{linkError}
			</div>
		{/if}

		<div class="mb-4 rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
			<h3 class="mb-2 text-sm font-medium text-[#f0ece4]">Instructions</h3>
			<ol class="list-inside list-decimal space-y-1 text-xs text-[#9a8f7a]">
				<li>Connect your AppGatePro device via USB</li>
				<li>Click "Link Device" below</li>
				<li>Select your device from the browser prompt</li>
				<li>Wait for confirmation from the device</li>
			</ol>
		</div>

		<button
			onclick={linkDevice}
			disabled={linkStatus === 'linking'}
			class="min-h-[44px] rounded-lg bg-[#f5a623] px-5 py-2.5
                   text-sm font-semibold text-[#0a0809] transition-colors hover:bg-[#c97e0a]
                   focus:ring-2 focus:ring-[#f5a623]
                   focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if linkStatus === 'linking'}
				Linking device...
			{:else if linkStatus === 'success'}
				Link another device
			{:else}
				Link Device
			{/if}
		</button>

		<p class="mt-3 text-xs text-[#6b5f4d]">
			Note: This requires a Chromium-based browser (Chrome, Edge, Opera) with Web Serial API
			support.
		</p>
	</div>
</div>

<!-- My Coaches - Full width section -->
<div class="mt-6 rounded-xl border border-[#221c18] bg-[#131010] p-6">
	<h2 class="mb-1 text-lg font-semibold text-[#f0ece4]">My Coaches</h2>
	<p class="mb-6 text-xs text-[#9a8f7a]">
		Coaches you've accepted can view your onboarding profile and goals, exchange messages with
		you, and receive reports you choose to send them. They can never edit your data or see your
		private notes.
	</p>

	{#if errorFor('coachError')}
		<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
			{errorFor('coachError')}
		</div>
	{/if}
	{#if successFor('coachSuccess')}
		<div
			class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
		>
			Done
		</div>
	{/if}

	{#if (data.pendingCoachInvites?.length ?? 0) > 0}
		<div class="mb-4 space-y-2">
			<h3 class="mb-2 text-sm font-medium text-[#f0ece4]">Pending invites</h3>
			{#each data.pendingCoachInvites as invite (invite.linkId)}
				<div
					class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4"
				>
					<div>
						<p class="text-sm font-medium text-[#f0ece4]">{invite.coachName}</p>
						<p class="text-xs text-[#6b5f4d]">{invite.coachEmail}</p>
					</div>
					<div class="flex gap-2">
						<form method="POST" action="?/acceptCoachInvite" onsubmit={() => (coachSaving = true)}>
							<input type="hidden" name="linkId" value={invite.linkId} />
							<button
								type="submit"
								disabled={coachSaving}
								class="rounded-lg bg-[#f5a623] px-3 py-1.5 text-xs font-semibold text-[#0a0809]
                                       transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
							>
								Accept
							</button>
						</form>
						<form method="POST" action="?/declineCoachInvite" onsubmit={() => (coachSaving = true)}>
							<input type="hidden" name="linkId" value={invite.linkId} />
							<button
								type="submit"
								disabled={coachSaving}
								class="rounded-lg border border-[#221c18] px-3 py-1.5 text-xs text-[#9a8f7a]
                                       transition-colors hover:text-[#f0ece4] disabled:opacity-50"
							>
								Decline
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if (data.pendingParentApproval?.length ?? 0) > 0}
		<div class="mb-4 space-y-2">
			<h3 class="mb-2 text-sm font-medium text-[#f0ece4]">Waiting on parent/guardian approval</h3>
			{#each data.pendingParentApproval as invite (invite.linkId)}
				<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
					<p class="text-sm font-medium text-[#f0ece4]">{invite.coachName}</p>
					<p class="text-xs text-[#6b5f4d]">
						An email has been sent to your parent/guardian for approval.
					</p>
				</div>
			{/each}
		</div>
	{/if}

	{#if (data.activeCoaches?.length ?? 0) > 0}
		<div class="space-y-2">
			<h3 class="mb-2 text-sm font-medium text-[#f0ece4]">Active</h3>
			{#each data.activeCoaches as coach (coach.linkId)}
				<div
					class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#221c18] bg-[#0a0809] p-4"
				>
					<div>
						<p class="text-sm font-medium text-[#f0ece4]">{coach.coachName}</p>
						<p class="text-xs text-[#6b5f4d]">{coach.coachEmail}</p>
					</div>
					<form method="POST" action="?/removeCoach" onsubmit={() => (coachSaving = true)}>
						<input type="hidden" name="linkId" value={coach.linkId} />
						<button
							type="submit"
							disabled={coachSaving}
							class="rounded-lg border border-red-800/40 px-3 py-1.5 text-xs text-red-400
                                   transition-colors hover:bg-red-900/20 disabled:opacity-50"
						>
							Remove
						</button>
					</form>
				</div>
			{/each}
		</div>
	{:else if (data.pendingCoachInvites?.length ?? 0) === 0 && (data.pendingParentApproval?.length ?? 0) === 0}
		<p class="text-sm text-[#6b5f4d]">No coaches yet.</p>
	{/if}
</div>

<!-- Become a Coach - Full width section -->
<div class="mt-6 rounded-xl border border-[#221c18] bg-[#131010] p-6">
	<h2 class="mb-1 text-lg font-semibold text-[#f0ece4]">Become a Coach</h2>
	<p class="mb-6 text-sm text-[#9a8f7a]">
		Apply to coach riders on AppGatePro. An admin reviews every application before you can invite
		anyone.
	</p>

	{#if errorFor('coachAppError')}
		<div class="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
			{errorFor('coachAppError')}
		</div>
	{/if}
	{#if successFor('coachAppSuccess')}
		<div
			class="mb-4 rounded-lg border border-[#3de8c8]/30 bg-[#3de8c8]/10 p-3 text-sm text-[#3de8c8]"
		>
			Application submitted — you'll see its status here once an admin reviews it.
		</div>
	{/if}

	{#if data.profile?.coach_status === 'approved'}
		<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
			<p class="mb-2 text-sm font-medium text-[#f0ece4]">You're an approved coach.</p>
			<a
				href="/coach"
				class="text-sm font-medium text-[#f5a623] transition-colors hover:text-[#c97e0a]"
			>
				Go to your coach dashboard →
			</a>
		</div>
	{:else if data.profile?.coach_status === 'pending'}
		<div class="rounded-lg border border-[#221c18] bg-[#0a0809] p-4">
			<p class="text-sm text-[#f0ece4]">Your coach application is pending review.</p>
			{#if data.latestCoachApplication?.submitted_at}
				<p class="mt-1 text-xs text-[#6b5f4d]">
					Submitted {new Date(data.latestCoachApplication.submitted_at).toLocaleDateString('en-GB', {
						day: 'numeric',
						month: 'long',
						year: 'numeric'
					})}
				</p>
			{/if}
		</div>
	{:else}
		{#if data.profile?.coach_status === 'rejected'}
			<div class="mb-4 rounded-lg border border-[#221c18] bg-[#0a0809] p-3 text-sm text-[#9a8f7a]">
				Your previous application wasn't approved{#if data.latestCoachApplication?.review_notes}:
					{data.latestCoachApplication.review_notes}{/if}. You're welcome to apply again.
			</div>
		{/if}
		<form
			method="POST"
			action="?/applyCoach"
			onsubmit={() => (coachAppSaving = true)}
			class="space-y-4"
		>
			<div>
				<label for="coachClub" class="mb-1.5 block text-sm font-medium text-[#9a8f7a]">
					Club / team
				</label>
				<input
					id="coachClub"
					name="club"
					type="text"
					bind:value={coachClub}
					class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                           text-[#f0ece4] placeholder-[#4a4038] transition-colors focus:border-[#f5a623]
                           focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
					placeholder="Mid Lancs BMX Race Club"
				/>
			</div>
			<div>
				<label
					for="coachQualificationDetails"
					class="mb-1.5 block text-sm font-medium text-[#9a8f7a]"
				>
					Coaching qualifications / safeguarding certification
				</label>
				<textarea
					id="coachQualificationDetails"
					name="qualificationDetails"
					rows="3"
					bind:value={coachQualificationDetails}
					class="w-full rounded-lg border border-[#221c18] bg-[#0a0809] px-4 py-2.5 text-sm
                           text-[#f0ece4] placeholder-[#4a4038] transition-colors focus:border-[#f5a623]
                           focus:ring-1 focus:ring-[#f5a623] focus:outline-none"
					placeholder="Coaching qualification, DBS certificate number, governing body membership, etc."
				></textarea>
			</div>
			<button
				type="submit"
				disabled={coachAppSaving}
				class="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a0809]
                       transition-colors hover:bg-[#c97e0a] disabled:opacity-50"
			>
				{coachAppSaving ? 'Submitting…' : 'Submit application'}
			</button>
		</form>
	{/if}
</div>

<!-- Danger Zone - Full width section -->
<div class="mt-6 rounded-xl border border-red-800/30 bg-[#131010] p-6">
	<h2 class="mb-1 text-lg font-semibold text-red-400">Danger Zone</h2>
	<p class="mb-6 text-xs text-[#9a8f7a]">Irreversible actions — proceed with caution</p>

	<div class="max-w-3xl rounded-lg border border-red-800/20 bg-red-900/10 p-4">
		<h3 class="mb-2 text-sm font-medium text-[#f0ece4]">Delete Account</h3>
		<p class="mb-4 text-xs text-[#9a8f7a]">
			Once you delete your account, there is no going back. All your sessions, analytics and profile
			data will be permanently removed.
		</p>

		{#if !showDeleteConfirm}
			<button
				onclick={() => (showDeleteConfirm = true)}
				class="min-h-[44px] rounded-lg border border-red-800/40 bg-red-900/20
                       px-4 py-2.5 text-sm font-medium text-red-400
                       transition-colors hover:bg-red-900/30
                       focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)] focus:outline-none"
			>
				Delete my account
			</button>
		{:else}
			<div class="space-y-3">
				<p class="text-sm font-semibold text-red-400">Are you absolutely sure?</p>
				<p class="text-xs text-[#9a8f7a]">
					This cannot be undone. This will permanently delete your account and remove all associated
					data.
				</p>
				<div class="flex flex-wrap gap-3">
					<form method="POST" action="?/deleteAccount">
						<button
							type="submit"
							class="min-h-[44px] rounded-lg bg-red-600 px-4 py-2.5
                                       text-sm font-medium text-white transition-colors hover:bg-red-700
                                       focus:ring-2 focus:ring-red-500 focus:outline-none"
						>
							Yes, delete my account
						</button>
					</form>
					<button
						onclick={() => (showDeleteConfirm = false)}
						class="min-h-[44px] rounded-lg bg-[#221c18] px-4 py-2.5
                                   text-sm font-medium text-[#f0ece4] transition-colors hover:bg-[#2a221d]
                                   focus:ring-2 focus:ring-[#f5a623] focus:outline-none"
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.input-field) {
		padding: 0.625rem 1rem;
		background: #0a0809;
		border: 1px solid #221c18;
		border-radius: 0.5rem;
		color: #f0ece4;
		font-size: 0.875rem;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	:global(.input-field:focus) {
		outline: none;
		border-color: #f5a623;
		box-shadow: 0 0 0 1px #f5a623;
	}
	:global(.btn-primary) {
		padding: 0.625rem 1.25rem;
		min-height: 44px;
		background: #f5a623;
		color: #0a0809;
		font-weight: 600;
		font-size: 0.875rem;
		border-radius: 0.5rem;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}
	:global(.btn-primary:hover) {
		background: #c97e0a;
	}
	:global(.btn-primary:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
