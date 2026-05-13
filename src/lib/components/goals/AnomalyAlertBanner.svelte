<script lang="ts">
    import type { Alert } from '$lib/services/anomalyDetection';
    import { getAlertIcon, getAlertColor } from '$lib/services/anomalyDetection';

    interface Props {
        alert: Alert;
        onDismiss?: () => void;
        onAction?: () => void;
    }

    let { alert, onDismiss, onAction }: Props = $props();

    const alertColor = $derived(getAlertColor(alert));
    const alertIcon = $derived(getAlertIcon(alert));

    // Get priority styling
    function getPriorityStyle(priority: Alert['priority']): string {
        switch (priority) {
            case 'critical': return 'bg-[#ff4444]/10 border-[#ff4444]/30';
            case 'warning': return 'bg-[#f5a623]/10 border-[#f5a623]/30';
            case 'info': return 'bg-[#3de8c8]/10 border-[#3de8c8]/30';
        }
    }

    const priorityStyle = $derived(getPriorityStyle(alert.priority));
</script>

<div 
    class="border rounded-lg p-4 {priorityStyle}"
    role="alert"
>
    <div class="flex items-start gap-3">
        <!-- Icon -->
        <span class="text-2xl flex-shrink-0">{alertIcon}</span>

        <!-- Content -->
        <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
                <h4 class="text-sm font-semibold" style="color: {alertColor}">
                    {alert.title}
                </h4>
                {#if alert.dismissible && onDismiss}
                    <button
                        onclick={onDismiss}
                        class="text-[#9a8f7a] hover:text-[#f0ece4] transition-colors p-1 -mt-1 -mr-1
                               focus:outline-none focus:ring-2 focus:ring-[#f5a623] rounded"
                        aria-label="Dismiss alert"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                {/if}
            </div>

            <p class="text-sm text-[#9a8f7a] leading-relaxed">
                {alert.message}
            </p>

            <!-- Action Button -->
            {#if alert.actionRequired && alert.actionText}
                <div class="mt-3">
                    <button
                        onclick={onAction}
                        class="text-sm font-medium px-4 py-2 rounded-lg transition-colors
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#131010]"
                        style="background-color: {alertColor}20; color: {alertColor}; border: 1px solid {alertColor}40"
                    >
                        {alert.actionText}
                    </button>
                </div>
            {/if}

            <!-- Timestamp -->
            <p class="text-xs text-[#6b5f4d] mt-2">
                {new Date(alert.timestamp).toLocaleTimeString()}
            </p>
        </div>
    </div>
</div>
