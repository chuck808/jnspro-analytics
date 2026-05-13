/**
 * Export Helpers for Admin Dashboards
 * Provides CSV, JSON export functionality
 */

export function exportToCSV(data: any[], filename: string) {
	if (data.length === 0) {
		alert('No data to export');
		return;
	}

	// Get headers from first object
	const headers = Object.keys(data[0]);
	
	// Create CSV content
	const csvContent = [
		headers.join(','), // Header row
		...data.map(row => 
			headers.map(header => {
				const value = row[header];
				// Escape commas and quotes
				if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value ?? '';
			}).join(',')
		)
	].join('\n');

	// Create download link
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	
	link.setAttribute('href', url);
	link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
	link.style.visibility = 'hidden';
	
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export function exportToJSON(data: any, filename: string) {
	const jsonContent = JSON.stringify(data, null, 2);
	
	const blob = new Blob([jsonContent], { type: 'application/json' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	
	link.setAttribute('href', url);
	link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
	link.style.visibility = 'hidden';
	
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export function formatDateForExport(date: string | Date): string {
	const d = new Date(date);
	return d.toISOString().split('T')[0];
}

export function generateHealthReport(data: {
	usersAtRisk: any[];
	healthWarnings: { critical: number; warning: number; caution: number };
	stats: any;
}) {
	return {
		generated_at: new Date().toISOString(),
		summary: {
			total_users_at_risk: data.usersAtRisk.length,
			critical_warnings: data.healthWarnings.critical,
			warnings: data.healthWarnings.warning,
			cautions: data.healthWarnings.caution,
			...data.stats
		},
		users_at_risk: data.usersAtRisk,
		recommendations: data.usersAtRisk.map(user => ({
			user_id: user.user_id,
			user_email: user.user_email,
			risk_type: user.risk_type,
			recommended_action: user.risk_type === 'overtraining' ? 'Suggest rest days' : 'Monitor closely',
			priority: user.sessions_count > 7 ? 'high' : 'medium'
		}))
	};
}
