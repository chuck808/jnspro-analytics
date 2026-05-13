<svelte:head>
    <title>About — AppGatePro Analytics</title>
    <meta name="description" content="Learn about AppGatePro Analytics, the premier performance tracking platform for BMX gate start training and analysis." />
</svelte:head>

<div class="min-h-screen bg-[#0a0809] text-[#f0ece4]">
    <div class="max-w-4xl mx-auto px-6 py-12 space-y-12">
        
        <!-- Header -->
        <div class="text-center">
            <div class="mb-6 flex justify-center">
                <img src="/logo-icon-dark.svg" alt="JNS Pro Systems Logo" class="w-24 h-24 object-contain" />
            </div>
            <h1 class="text-4xl font-bold text-[#f5a623] mb-3">About AppGatePro</h1>
            <p class="text-xl text-[#9a8f7a] max-w-2xl mx-auto">
                Professional BMX gate start analytics powered by precision IMU technology
            </p>
        </div>

        <!-- Mission -->
        <section class="bg-[#131010] border border-[#221c18] rounded-xl p-8">
            <h2 class="text-2xl font-bold text-[#f0ece4] mb-4">Our Mission</h2>
            <p class="text-[#9a8f7a] leading-relaxed mb-4">
                AppGatePro Analytics exists to transform BMX gate start training through data-driven insights. 
                We believe that every rider deserves access to professional-grade performance analytics that were 
                previously only available to elite athletes.
            </p>
            <p class="text-[#9a8f7a] leading-relaxed">
                By combining cutting-edge IMU sensor technology with advanced analytics, we help riders of all 
                levels understand their performance, track improvement, and gain competitive advantages through 
                measurable insights.
            </p>
        </section>

        <!-- How It Works -->
        <section class="bg-[#131010] border border-[#221c18] rounded-xl p-8">
            <h2 class="text-2xl font-bold text-[#f0ece4] mb-6">How It Works</h2>
            <div class="space-y-6">
                <div class="flex gap-4">
                    <div class="flex-shrink-0 w-10 h-10 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-lg flex items-center justify-center text-[#f5a623] font-bold">
                        1
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">Train with AppGatePro Device</h3>
                        <p class="text-[#9a8f7a]">
                            Attach the AppGatePro IMU device to your bike and train as normal. The device captures 
                            high-precision data including reaction time, acceleration (G-force), speed, and pitch angles.
                        </p>
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="flex-shrink-0 w-10 h-10 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-lg flex items-center justify-center text-[#f5a623] font-bold">
                        2
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">Upload Your Sessions</h3>
                        <p class="text-[#9a8f7a]">
                            After training, simply remove the SD card from your AppGatePro device and upload the 
                            session file through our secure web platform. Files are processed instantly.
                        </p>
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="flex-shrink-0 w-10 h-10 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-lg flex items-center justify-center text-[#f5a623] font-bold">
                        3
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-[#f0ece4] mb-2">Analyze & Improve</h3>
                        <p class="text-[#9a8f7a]">
                            Access comprehensive analytics including trend charts, consistency scoring, session comparisons, 
                            and statistical insights. Track your progress over time and identify areas for improvement.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Key Features -->
        <section class="bg-[#131010] border border-[#221c18] rounded-xl p-8">
            <h2 class="text-2xl font-bold text-[#f0ece4] mb-6">Key Features</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each [
                    { icon: 'lightning', title: 'Reaction Time Analysis', desc: 'Track your gate reaction down to the millisecond' },
                    { icon: 'chart', title: 'Trend Charts', desc: 'Visualize performance improvements over time' },
                    { icon: 'target', title: 'Consistency Scoring', desc: 'Measure run-to-run consistency with CV metrics' },
                    { icon: 'trending', title: 'Statistical Insights', desc: 'Correlation analysis and rolling averages' },
                    { icon: 'speed', title: 'Speed Estimation', desc: 'IMU-derived peak speed tracking' },
                    { icon: 'layers', title: 'Progressive Unlocks', desc: 'More analytics as you train more' },
                    { icon: 'trophy', title: 'Goal Tracking', desc: 'Set targets and monitor progress' },
                    { icon: 'download', title: 'Data Export', desc: 'Export your data to CSV for external analysis' }
                ] as feature}
                    <div class="p-4 bg-[#0a0809] rounded-lg border border-[#221c18] hover:border-[#f5a623]/30 transition-all group">
                        <div class="w-12 h-12 bg-[#f5a623]/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            {#if feature.icon === 'lightning'}
                                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
                                </svg>
                            {:else if feature.icon === 'chart'}
                                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                                </svg>
                            {:else if feature.icon === 'target'}
                                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            {:else if feature.icon === 'trending'}
                                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                </svg>
                            {:else if feature.icon === 'speed'}
                                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                            {:else if feature.icon === 'layers'}
                                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                            {:else if feature.icon === 'trophy'}
                                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                                </svg>
                            {:else if feature.icon === 'download'}
                                <svg class="w-6 h-6 text-[#f5a623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                            {/if}
                        </div>
                        <h3 class="text-sm font-semibold text-[#f0ece4] mb-1">{feature.title}</h3>
                        <p class="text-xs text-[#9a8f7a] leading-relaxed">{feature.desc}</p>
                    </div>
                {/each}
            </div>
        </section>

        <!-- Technology -->
        <section class="bg-[#131010] border border-[#221c18] rounded-xl p-8">
            <h2 class="text-2xl font-bold text-[#f0ece4] mb-4">Technology Stack</h2>
            <p class="text-[#9a8f7a] mb-4">
                Built with modern web technologies for speed, reliability, and security:
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                {#each ['SvelteKit', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Chart.js', 'PostgreSQL'] as tech}
                    <div class="px-3 py-2 bg-[#0a0809] border border-[#221c18] rounded text-center text-sm text-[#f5a623]">
                        {tech}
                    </div>
                {/each}
            </div>
        </section>

        <!-- JNS Pro Systems -->
        <section class="bg-[#131010] border border-[#221c18] rounded-xl p-8">
            <h2 class="text-2xl font-bold text-[#f0ece4] mb-4">About JNS Pro Systems</h2>
            <p class="text-[#9a8f7a] leading-relaxed mb-4">
                JNS Pro Systems is dedicated to developing innovative training technology for BMX racing. 
                Our team combines expertise in embedded systems, data science, and competitive BMX racing 
                to create products that make a real difference in athlete performance.
            </p>
            <p class="text-[#9a8f7a] leading-relaxed">
                AppGatePro represents our commitment to making professional-grade training tools accessible 
                to riders at all levels, from beginners to world-class competitors.
            </p>
        </section>

        <!-- Contact CTA -->
        <div class="text-center py-8">
            <p class="text-[#9a8f7a] mb-6">
                Have questions or want to learn more?
            </p>
            <a href="/contact" 
               class="inline-flex items-center gap-2 px-6 py-3 bg-[#f5a623] hover:bg-[#c97e0a]
                      text-[#0a0809] font-semibold rounded-lg transition-colors
                      focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:ring-offset-2 focus:ring-offset-[#0a0809]">
                Get in Touch
            </a>
        </div>

        <!-- Footer Links -->
        <div class="border-t border-[#221c18] pt-6 text-center">
            <div class="flex justify-center gap-6 text-sm">
                <a href="/" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">Home</a>
                <a href="/contact" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">Contact</a>
                <a href="/privacy" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">Privacy</a>
                <a href="/terms" class="text-[#9a8f7a] hover:text-[#f5a623] transition-colors">Terms</a>
            </div>
            <p class="text-xs text-[#6b5f4d] mt-4">
                © 2026 JNS Pro Systems. All rights reserved.
            </p>
        </div>

    </div>
</div>
