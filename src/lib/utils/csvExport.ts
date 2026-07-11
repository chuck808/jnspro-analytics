export function exportSessionsToCSV(sessions: any[]) {
	const headers = [
		'Date',
		'Session Type',
		'Run Count',
		'Best Reaction (ms)',
		'Avg Reaction (ms)',
		'Best Max G',
		'Best Peak Speed (m/s)',
		'Has Valid Speed',
		'Consistency CV (%)'
	];

	const rows = sessions.map((s) => [
		new Date(s.timestamp).toLocaleDateString(),
		s.session_type || 'gate',
		s.run_count,
		s.best_reaction_ms?.toFixed(2) || '',
		s.avg_reaction_ms?.toFixed(2) || '',
		s.best_max_g?.toFixed(2) || '',
		s.best_peak_speed_ms?.toFixed(2) || '',
		s.has_valid_speed ? 'Yes' : 'No',
		s.reaction_cv?.toFixed(2) || ''
	]);

	const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', `sessions_export_${Date.now()}.csv`);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

export function exportRunDetailsToCSV(run: any) {
	const headers = ['Metric', 'Value', 'Unit'];

	const rows = [
		['Run Number', run.run_number, ''],
		['Reaction Time', (run.gate_runs?.reaction_time_ms / 1000)?.toFixed(3), 's'],
		['Elapsed Time', run.elapsed_time_ms, 'ms'],
		['Max G-Force', run.gate_runs?.max_g?.toFixed(2), 'G'],
		['Avg G-Force', run.gate_runs?.avg_g?.toFixed(2), 'G'],
		[
			'Peak Speed',
			run.gate_runs?.peak_speed_ms ? (run.gate_runs.peak_speed_ms * 3.6).toFixed(1) : '',
			'km/h'
		],
		['End Speed', run.gate_runs?.speed_ms ? (run.gate_runs.speed_ms * 3.6).toFixed(1) : '', 'km/h'],
		['Time to Peak Speed', run.gate_runs?.time_to_peak_speed_ms, 'ms'],
		['Max Pitch', run.gate_runs?.max_pitch_deg?.toFixed(1), '°'],
		['Front Wheel Lifted', run.gate_runs?.front_wheel_lifted ? 'Yes' : 'No', '']
	];

	const csvContent = [
		headers.join(','),
		...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
	].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', `run_${run.run_number}_export.csv`);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}
