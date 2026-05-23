<script lang="ts">
    import type { PageData, ActionData } from './$types';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    let accountSaving       = $state(false);
    let passwordSaving      = $state(false);
    let notificationsSaving = $state(false);
    let preferencesSaving   = $state(false);
    let showDeleteConfirm   = $state(false);
    let linkStatus: 'idle' | 'linking' | 'success' | 'error' = $state('idle');
    let linkError = $state('');

    function successFor(key: string) {
        return (form as any)?.[key] === true;
    }
    function errorFor(key: string) {
        return (form as any)?.[key] as string | undefined;
    }

    async function linkDevice() {
        linkStatus = 'linking';
        linkError  = '';

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
                device_id:     parsed[2],
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
            await new Promise(resolve => setTimeout(resolve, 500));

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
                    const errLine = responseStr.split('\n').find(l => l.includes('PROVISION_ERR'));
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
            linkError  = err?.message ?? 'Unknown error during linking';
            linkStatus = 'error';
        }
    }
</script>

<svelte:head>
    <title>Settings — AppGatePro</title>
</svelte:head>

<!-- Page header -->
<div class="mb-8">
    <h1 class="text-3xl font-bold themed-text-primary">Settings</h1>
    <p class="text-sm themed-text-secondary mt-2">
        Manage your account, notifications, and application preferences
    </p>
</div>

<!-- Full-width grid layout -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

    <!-- Account & Security -->
    <div class="themed-card rounded-xl p-6">
        <h2 class="text-lg font-semibold themed-text-primary mb-1">Account & Security</h2>
        <p class="text-xs themed-text-secondary mb-6">Update your email address and password</p>

        <!-- Update Email -->
        <div class="mb-8">
            <h3 class="text-sm font-medium text-[#f0ece4] mb-4">Email Address</h3>

            {#if successFor('accountSuccess')}
                <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                    Email updated — check your inbox to verify your new address.
                </div>
            {/if}
            {#if errorFor('accountError')}
                <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                    {errorFor('accountError')}
                </div>
            {/if}

            <form method="POST" action="?/updateAccount"
                  onsubmit={() => accountSaving = true}
                  class="space-y-4">
                <div>
                    <label for="email" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                        Email address
                    </label>
                    <input id="email" name="email" type="email" required
                           value={data.profile?.email ?? ''}
                           class="input-field w-full" />
                    <p class="text-xs text-[#6b5f4d] mt-1">
                        Changing your email will require verification
                    </p>
                </div>
                <button type="submit" disabled={accountSaving} class="btn-primary">
                    {accountSaving ? 'Updating...' : 'Update email'}
                </button>
            </form>
        </div>

        <!-- Change Password -->
        <div class="pt-6 border-t border-[#221c18]">
            <h3 class="text-sm font-medium text-[#f0ece4] mb-4">Change Password</h3>

            {#if successFor('passwordSuccess')}
                <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                    Password updated successfully
                </div>
            {/if}
            {#if errorFor('passwordError')}
                <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                    {errorFor('passwordError')}
                </div>
            {/if}

            <form method="POST" action="?/updatePassword"
                  onsubmit={() => passwordSaving = true}
                  class="space-y-4">
                <div>
                    <label for="newPassword" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                        New password
                    </label>
                    <input id="newPassword" name="newPassword" type="password"
                           minlength="8" required
                           class="input-field w-full"
                           autocomplete="new-password" />
                    <p class="text-xs text-[#6b5f4d] mt-1">Minimum 8 characters</p>
                </div>
                <button type="submit" disabled={passwordSaving} class="btn-primary">
                    {passwordSaving ? 'Updating...' : 'Change password'}
                </button>
            </form>
        </div>
    </div>

    <!-- Notifications -->
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
        <h2 class="text-lg font-semibold text-[#f0ece4] mb-1">Notifications & Alerts</h2>
        <p class="text-xs text-[#9a8f7a] mb-6">Control which emails you receive from us</p>

        {#if successFor('notificationsSuccess')}
            <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                Notification preferences saved
            </div>
        {/if}
        {#if errorFor('notificationsError')}
            <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {errorFor('notificationsError')}
            </div>
        {/if}

        <form method="POST" action="?/updateNotifications"
              onsubmit={() => notificationsSaving = true}
              class="space-y-4">
            <div class="space-y-3">
                {#each [
                    {
                        id: 'email_alerts',
                        name: 'email_alerts',
                        label: 'Email Alerts',
                        desc: 'Receive emails about important updates and features',
                        checked: data.preferences?.email_alerts ?? false,
                    },
                    {
                        id: 'progress_reports',
                        name: 'progress_reports',
                        label: 'Progress Reports',
                        desc: 'Weekly or monthly summaries of your performance data',
                        checked: data.preferences?.progress_reports ?? false,
                    }
                ] as pref}
                    <div class="flex items-start gap-3 p-4 bg-[#0a0809] border border-[#221c18] rounded-lg min-h-[44px]">
                        <input type="checkbox"
                               id={pref.id}
                               name={pref.name}
                               value="true"
                               checked={pref.checked}
                               class="mt-0.5 accent-[#f5a623]" />
                        <div class="flex-1">
                            <label for={pref.id} class="text-sm font-medium text-[#f0ece4] cursor-pointer">
                                {pref.label}
                            </label>
                            <p class="text-xs text-[#6b5f4d] mt-0.5">{pref.desc}</p>
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
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
        <h2 class="text-lg font-semibold text-[#f0ece4] mb-1">Display Preferences</h2>
        <p class="text-xs text-[#9a8f7a] mb-6">Customize how data is displayed in the app</p>

        {#if successFor('preferencesSuccess')}
            <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                Preferences saved
            </div>
        {/if}
        {#if errorFor('preferencesError')}
            <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {errorFor('preferencesError')}
            </div>
        {/if}

        <form method="POST" action="?/updatePreferences"
              onsubmit={() => preferencesSaving = true}
              class="space-y-4">
            <div class="flex items-start gap-3 p-4 bg-[#0a0809] border border-[#221c18] rounded-lg min-h-[44px]">
                <input type="checkbox"
                       id="show_decimal"
                       name="show_decimal"
                       value="true"
                       checked={data.preferences?.show_decimal ?? false}
                       class="mt-0.5 accent-[#f5a623]" />
                <div class="flex-1">
                    <label for="show_decimal" class="text-sm font-medium text-[#f0ece4] cursor-pointer">
                        Show decimal places
                    </label>
                    <p class="text-xs text-[#6b5f4d] mt-0.5">
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
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
        <h2 class="text-lg font-semibold text-[#f0ece4] mb-1">Leaderboard & Competition</h2>
        <p class="text-xs text-[#9a8f7a] mb-6">
            Compete with riders worldwide while protecting your privacy
        </p>

        {#if successFor('leaderboardSuccess')}
            <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                Leaderboard preferences saved
            </div>
        {/if}
        {#if errorFor('leaderboardError')}
            <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {errorFor('leaderboardError')}
            </div>
        {/if}

        <form method="POST" action="?/updateLeaderboard" class="space-y-4">
            <div class="flex items-start gap-3 p-4 bg-[#0a0809] border border-[#221c18] rounded-lg min-h-[44px]">
                <input type="checkbox"
                       id="show_on_leaderboard"
                       name="show_on_leaderboard"
                       value="true"
                       checked={data.preferences?.show_on_leaderboard}
                       class="mt-0.5 accent-[#f5a623]" />
                <div class="flex-1">
                    <label for="show_on_leaderboard" class="text-sm font-medium text-[#f0ece4] cursor-pointer">
                        Show on Leaderboard
                    </label>
                    <p class="text-xs text-[#6b5f4d] mt-0.5">
                        Share your best performances anonymously and see how you rank against other riders
                    </p>
                </div>
            </div>

            <div>
                <label for="leaderboard_display_name" class="block text-xs font-medium text-[#9a8f7a] mb-1.5">
                    Display Name <span class="text-[#6b5f4d] font-normal">(shown on leaderboard)</span>
                </label>
                <input id="leaderboard_display_name"
                       name="leaderboard_display_name"
                       type="text"
                       value={data.preferences?.leaderboard_display_name ?? ''}
                       class="input-field w-full"
                       placeholder="e.g. SpeedRider247 (leave blank for auto-generated)" />
                <p class="text-xs text-[#6b5f4d] mt-1">
                    Your real name is never shown. Choose an anonymous name or we'll generate one for you.
                </p>
            </div>

            <button type="submit" class="btn-primary">
                Save leaderboard preferences
            </button>
        </form>

        <div class="mt-4 pt-4 border-t border-[#221c18]">
            <a href="/leaderboard"
               class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f5a623]/10 hover:bg-[#f5a623]/20
                      text-[#f5a623] text-sm font-medium rounded-lg transition-colors min-h-[44px]
                      focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                View Leaderboard →
            </a>
        </div>
    </div>

    <!-- Training Goals link -->
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
        <h2 class="text-lg font-semibold text-[#f0ece4] mb-1">Training Goals</h2>
        <p class="text-xs text-[#9a8f7a] mb-4">
            Set performance targets and track your progress over time
        </p>
        <a href="/goals"
           class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#221c18] hover:bg-[#2a221d]
                  text-[#f0ece4] text-sm font-medium rounded-lg transition-colors min-h-[44px]
                  focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]">
            <svg class="w-4 h-4 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Manage training goals →
        </a>
    </div>

    <!-- Device Linking (USB) -->
    <div class="bg-[#131010] border border-[#221c18] rounded-xl p-6">
        <h2 class="text-lg font-semibold text-[#f0ece4] mb-1">Link Device</h2>
        <p class="text-xs text-[#9a8f7a] mb-6">
            Connect your AppGatePro device via USB to provision credentials
        </p>

        {#if linkStatus === 'success'}
            <div class="mb-4 p-3 bg-[#3de8c8]/10 border border-[#3de8c8]/30 rounded-lg text-[#3de8c8] text-sm">
                ✓ Device linked successfully! Your device can now upload data.
            </div>
        {/if}
        {#if linkStatus === 'error' && linkError}
            <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {linkError}
            </div>
        {/if}

        <div class="p-4 bg-[#0a0809] border border-[#221c18] rounded-lg mb-4">
            <h3 class="text-sm font-medium text-[#f0ece4] mb-2">Instructions</h3>
            <ol class="text-xs text-[#9a8f7a] space-y-1 list-decimal list-inside">
                <li>Connect your AppGatePro device via USB</li>
                <li>Click "Link Device" below</li>
                <li>Select your device from the browser prompt</li>
                <li>Wait for confirmation from the device</li>
            </ol>
        </div>

        <button
            onclick={linkDevice}
            disabled={linkStatus === 'linking'}
            class="px-5 py-2.5 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809]
                   font-semibold text-sm rounded-lg transition-colors min-h-[44px]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
            {#if linkStatus === 'linking'}
                Linking device...
            {:else if linkStatus === 'success'}
                Link another device
            {:else}
                Link Device
            {/if}
        </button>

        <p class="text-xs text-[#6b5f4d] mt-3">
            Note: This requires a Chromium-based browser (Chrome, Edge, Opera) with Web Serial API support.
        </p>
    </div>

</div>

<!-- Danger Zone - Full width section -->
<div class="mt-6 bg-[#131010] border border-red-800/30 rounded-xl p-6">
    <h2 class="text-lg font-semibold text-red-400 mb-1">Danger Zone</h2>
    <p class="text-xs text-[#9a8f7a] mb-6">Irreversible actions — proceed with caution</p>

    <div class="p-4 bg-red-900/10 border border-red-800/20 rounded-lg max-w-3xl">
        <h3 class="text-sm font-medium text-[#f0ece4] mb-2">Delete Account</h3>
        <p class="text-xs text-[#9a8f7a] mb-4">
            Once you delete your account, there is no going back. All your sessions,
            analytics and profile data will be permanently removed.
        </p>

        {#if !showDeleteConfirm}
            <button
                onclick={() => showDeleteConfirm = true}
                class="px-4 py-2.5 bg-red-900/20 hover:bg-red-900/30 text-red-400
                       border border-red-800/40 rounded-lg text-sm font-medium
                       transition-colors min-h-[44px]
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]">
                Delete my account
            </button>
        {:else}
            <div class="space-y-3">
                <p class="text-sm font-semibold text-red-400">Are you absolutely sure?</p>
                <p class="text-xs text-[#9a8f7a]">
                    This cannot be undone. This will permanently delete your account
                    and remove all associated data.
                </p>
                <div class="flex gap-3 flex-wrap">
                    <form method="POST" action="?/deleteAccount">
                        <button type="submit"
                                class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white
                                       rounded-lg text-sm font-medium transition-colors min-h-[44px]
                                       focus:outline-none focus:ring-2 focus:ring-red-500">
                            Yes, delete my account
                        </button>
                    </form>
                    <button onclick={() => showDeleteConfirm = false}
                            class="px-4 py-2.5 bg-[#221c18] hover:bg-[#2a221d] text-[#f0ece4]
                                   rounded-lg text-sm font-medium transition-colors min-h-[44px]
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623]">
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
        transition: border-color 0.15s, box-shadow 0.15s;
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
    :global(.btn-primary:hover)    { background: #c97e0a; }
    :global(.btn-primary:disabled) { opacity: 0.5; cursor: not-allowed; }
</style>