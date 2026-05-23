<script lang="ts">
    import { fade } from 'svelte/transition';
    
    let expandedFaq = $state<string | null>(null);
    
    function toggleFaq(id: string) {
        expandedFaq = expandedFaq === id ? null : id;
    }

    const faqs = [
        {
            id: 'upload',
            category: 'Getting Started',
            question: 'How do I upload my first session?',
            answer: 'Click "Upload Session" in the navigation bar. Select your CSV file from the AppGate system, add session details (bike, date, etc.), and click Upload. The system will process your run data and display analytics within seconds.'
        },
        {
            id: 'bike',
            category: 'Getting Started',
            question: 'Do I need to set up my bike first?',
            answer: 'Yes! Go to Profile → Bikes and add your bike details (make, model, weight). This unlocks power analysis and ensures accurate performance calculations. You can add multiple bikes if you train on different setups.'
        },
        {
            id: 'speed-blocked',
            category: 'Troubleshooting',
            question: 'Why are my speed metrics showing as blocked?',
            answer: 'Speed analytics require proper sensor calibration. If you see "Speed Blocked" or dashes instead of speed values, your AppGate sensors may need recalibration. Check the calibration warning on your session page for specific guidance.'
        },
        {
            id: 'power-blocked',
            category: 'Troubleshooting',
            question: 'Why can\'t I see power metrics?',
            answer: 'Power analysis requires your weight and bike weight. Go to Profile → Personal Info and add your weight, then add your bike weight in Profile → Bikes. Once both are set, power metrics will appear in your next session upload.'
        },
        {
            id: 'reaction-time',
            category: 'Understanding Metrics',
            question: 'What is a good reaction time?',
            answer: 'Elite riders: 0.250-0.350s | Advanced: 0.350-0.450s | Intermediate: 0.450-0.600s. Consistency is more important than a single fast reaction. Aim for low CV% (under 5%) to show repeatable starts.'
        },
        {
            id: 'max-g',
            category: 'Understanding Metrics',
            question: 'What does Max G-Force mean?',
            answer: 'Max G measures your peak acceleration force during the gate start. Higher G = more explosive power application. Elite riders typically achieve 2.5-3.5G, while developing riders may see 1.5-2.5G. This improves with strength and technique training.'
        },
        {
            id: 'consistency',
            category: 'Understanding Metrics',
            question: 'How is consistency calculated?',
            answer: 'Consistency uses Coefficient of Variation (CV%) - the standard deviation divided by the mean. Lower is better: <2% = Excellent, 2-5% = Good, 5-10% = Fair, >10% = Variable. Consistent starts show you can repeat good technique under pressure.'
        },
        {
            id: 'technique-score',
            category: 'Understanding Metrics',
            question: 'What are technique scores?',
            answer: 'Technique scores (0-100) evaluate: Reaction (timing), Explosiveness (power application), Smoothness (force consistency), and Efficiency (power transfer). Scores are benchmarked against your rider level. Focus on your lowest scores for maximum improvement.'
        },
        {
            id: 'goals',
            category: 'Features',
            question: 'How do training goals work?',
            answer: 'Go to Goals to set specific targets (e.g., "Reaction time under 0.400s by June"). The system tracks your progress automatically and shows milestones when achieved. Goals help maintain focus and motivation during training.'
        },
        {
            id: 'reports',
            category: 'Features',
            question: 'Can I generate reports to share?',
            answer: 'Yes! On any session page, click "Generate Report" and choose your detail level (Simple, Standard, Coach, or Technical). Reports include analysis, charts, and recommendations. Perfect for sharing progress with coaches, parents, or sponsors.'
        },
        {
            id: 'analytics-depth',
            category: 'Features',
            question: 'What do the analytics unlock thresholds mean?',
            answer: '1 session = Basic summaries | 2 sessions = Comparison | 3 sessions = Trends & consistency | 10 sessions = Full rolling analytics | 20 sessions = Statistical analysis. More data = better insights into your patterns and progress.'
        },
        {
            id: 'leaderboard',
            category: 'Features',
            question: 'How does the leaderboard work?',
            answer: 'Leaderboards show top performers by UCI age category. Your best metrics from the last 30 days are compared with other riders. Opt-in only - your data stays private unless you choose to participate in rankings.'
        },
        {
            id: 'data-quality',
            category: 'Troubleshooting',
            question: 'What do the data quality badges mean?',
            answer: 'Excellent = Perfect sensor data | Good = Minor calibration offset | Fair = Noticeable drift | Calibrate = Major issues, recalibrate sensors. Poor data quality affects speed and power accuracy. Always check quality badges before analyzing technique.'
        },
        {
            id: 'csv-format',
            category: 'Data & Upload',
            question: 'What CSV format is required?',
            answer: 'AppGate system exports are supported directly. Files must include: timestamp, G-force data, elapsed time, and gate trigger data. If you\'re having upload issues, ensure your AppGate firmware is up to date and sensors are properly paired.'
        },
        {
            id: 'multiple-runs',
            category: 'Data & Upload',
            question: 'Can I upload multiple runs at once?',
            answer: 'Yes! Upload a session file containing multiple runs. The system automatically detects gate triggers and splits them into individual runs. You\'ll see cross-run analysis, progression charts, and consistency metrics for the full session.'
        },
        {
            id: 'delete-session',
            category: 'Data & Upload',
            question: 'Can I delete a session if I uploaded it by mistake?',
            answer: 'Currently, session deletion requires admin access for data integrity. Contact support if you need a session removed. We\'re working on self-service deletion with confirmation safeguards.'
        },
        {
            id: 'export',
            category: 'Data & Upload',
            question: 'Can I export my data?',
            answer: 'Yes! On the Analytics page, use the Export button to download your session data as CSV or JSON. Reports can also be saved as PDF. Your data is yours - export anytime for external analysis or backup.'
        },
        {
            id: 'mobile',
            category: 'Platform & Access',
            question: 'Does this work on mobile?',
            answer: 'Yes! The entire platform is mobile-responsive. Charts adapt to smaller screens, and touch-friendly controls make it easy to review sessions trackside. For best experience on mobile, use landscape mode for charts.'
        },
        {
            id: 'offline',
            category: 'Platform & Access',
            question: 'Can I use this offline?',
            answer: 'Upload and analysis require internet connection. Once sessions are loaded, you can review them offline (cached in browser). We recommend uploading sessions when WiFi is available to avoid mobile data usage.'
        },
        {
            id: 'privacy',
            category: 'Platform & Access',
            question: 'Who can see my data?',
            answer: 'Your session data is private by default. Only you can see it. If you opt into leaderboards, only your best metrics (not full sessions) are visible to others. Coaches or parents you share reports with see what you send them - nothing more.'
        },
        {
            id: 'support',
            category: 'Help & Support',
            question: 'How do I get help or report a bug?',
            answer: 'Email support@appgatepro.com or use the Contact form. Include session details and screenshots if reporting a data issue. We typically respond within 24 hours. For urgent calibration issues, check the troubleshooting guide first.'
        },
        {
            id: 'account',
            category: 'Help & Support',
            question: 'How do I update my account details?',
            answer: 'Go to Profile to update name, email, weight, date of birth, and rider level. Changes affect future session analysis - historical data isn\'t recalculated. Make sure your rider level is accurate for proper technique benchmarking.'
        }
    ];

    const categories = [...new Set(faqs.map(f => f.category))];
</script>

<svelte:head>
    <title>Help & FAQ — AppGatePro Analytics</title>
</svelte:head>

<div class="px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg themed-bg-accent flex items-center justify-center">
                <svg class="w-6 h-6 themed-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <div>
                <h1 class="text-2xl font-bold themed-text-primary">Help & FAQ</h1>
                <p class="text-sm themed-text-secondary">Quick answers to common questions</p>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <a href="/upload" 
           class="bg-[#131010] border border-[#221c18] rounded-xl p-4 hover:border-[#f5a623]/40 transition-colors group">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-[#f5a623]/10 flex items-center justify-center group-hover:bg-[#f5a623]/20 transition-colors">
                    <svg class="w-5 h-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-semibold text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Upload Session</p>
                    <p class="text-xs text-[#6b5f4d]">Start analyzing</p>
                </div>
            </div>
        </a>

        <a href="/docs" 
           class="bg-[#131010] border border-[#221c18] rounded-xl p-4 hover:border-[#f5a623]/40 transition-colors group">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-[#f5a623]/10 flex items-center justify-center group-hover:bg-[#f5a623]/20 transition-colors">
                    <svg class="w-5 h-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-semibold text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">User Guide</p>
                    <p class="text-xs text-[#6b5f4d]">Full documentation</p>
                </div>
            </div>
        </a>

        <a href="mailto:support@appgatepro.com" 
           class="bg-[#131010] border border-[#221c18] rounded-xl p-4 hover:border-[#f5a623]/40 transition-colors group">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-[#f5a623]/10 flex items-center justify-center group-hover:bg-[#f5a623]/20 transition-colors">
                    <svg class="w-5 h-5 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-semibold text-[#f0ece4] group-hover:text-[#f5a623] transition-colors">Contact Support</p>
                    <p class="text-xs text-[#6b5f4d]">Get personal help</p>
                </div>
            </div>
        </a>
    </div>

    <!-- FAQ Categories -->
    {#each categories as category}
        <div class="mb-6">
            <h2 class="text-base font-bold text-[#f5a623] mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                {category}
            </h2>

            <div class="space-y-2">
                {#each faqs.filter(f => f.category === category) as faq}
                    <div class="bg-[#131010] border border-[#221c18] rounded-lg overflow-hidden">
                        <button
                            onclick={() => toggleFaq(faq.id)}
                            class="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#171210] transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-inset">
                            <span class="text-sm font-medium text-[#f0ece4]">{faq.question}</span>
                            <svg 
                                class="w-5 h-5 text-[#6b5f4d] transition-transform flex-shrink-0 {expandedFaq === faq.id ? 'rotate-180' : ''}"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        
                        {#if expandedFaq === faq.id}
                            <div class="px-5 pb-4 pt-1" transition:fade={{ duration: 200 }}>
                                <p class="text-sm text-[#9a8f7a] leading-relaxed">{faq.answer}</p>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/each}

    <!-- Still Need Help -->
    <div class="mt-8 bg-[#131010] border border-[#f5a623]/20 rounded-xl p-6">
        <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-lg bg-[#f5a623]/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
            </div>
            <div class="flex-1">
                <h3 class="text-base font-bold text-[#f0ece4] mb-2">Still need help?</h3>
                <p class="text-sm text-[#9a8f7a] mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                </p>
                <div class="flex flex-wrap gap-3">
                    <a href="mailto:support@appgatepro.com" 
                       class="inline-flex items-center gap-2 px-4 py-2 bg-[#f5a623] hover:bg-[#c97e0a] text-[#0a0809] 
                              text-sm font-semibold rounded-lg transition-colors
                              focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        Email Support
                    </a>
                    <a href="/docs" 
                       class="inline-flex items-center gap-2 px-4 py-2 bg-[#131010] border border-[#221c18] hover:border-[#f5a623]/40
                              text-[#f0ece4] text-sm font-medium rounded-lg transition-colors
                              focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[color:var(--theme-surface)]">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                        Read Full Guide
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>