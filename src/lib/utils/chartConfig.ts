export function getChartHeight() {
	if (typeof window === 'undefined') return 208; // Default for SSR

	const width = window.innerWidth;

	if (width < 640) return 160; // Mobile
	if (width < 1024) return 192; // Tablet
	return 208; // Desktop
}

export function getChartOptions(isMobile: boolean) {
	return {
		responsive: true,
		maintainAspectRatio: false,
		animation: { duration: isMobile ? 200 : 300 },
		plugins: {
			legend: {
				display: !isMobile, // Hide legends on mobile
				position: isMobile ? 'bottom' : 'top',
				labels: {
					boxWidth: isMobile ? 8 : 12,
					font: { size: isMobile ? 10 : 11 }
				}
			},
			tooltip: {
				enabled: true,
				mode: 'index' as const,
				intersect: false,
				backgroundColor: '#131010',
				titleColor: '#f5a623',
				bodyColor: '#9a8f7a',
				borderColor: '#221c18',
				borderWidth: 1,
				titleFont: { size: isMobile ? 11 : 12 },
				bodyFont: { size: isMobile ? 10 : 11 }
			}
		},
		scales: {
			x: {
				ticks: {
					maxTicksLimit: isMobile ? 4 : 8,
					font: { size: isMobile ? 9 : 10 }
				}
			},
			y: {
				ticks: {
					font: { size: isMobile ? 9 : 10 }
				}
			}
		}
	};
}
