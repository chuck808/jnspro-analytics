// Data export utilities for session data

export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) {
        throw new Error('No data to export');
    }

    // Get all unique keys from all objects
    const headers = Array.from(
        new Set(data.flatMap(obj => Object.keys(obj)))
    );

    // Create CSV header row
    const csvHeaders = headers.join(',');

    // Create CSV data rows
    const csvRows = data.map(obj => 
        headers.map(header => {
            const value = obj[header];
            // Handle null/undefined
            if (value == null) return '';
            // Escape and quote strings containing commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    );

    const csv = [csvHeaders, ...csvRows].join('\n');

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

export function exportToJSON(data: any, filename: string) {
    const json = JSON.stringify(data, null, 2);
    
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

export function formatSessionsForExport(sessions: any[]) {
    return sessions.flatMap(session => {
        const baseData = {
            session_id: session.id,
            session_date: session.timestamp,
            session_type: session.session_type,
        };

        // Flatten runs data
        return (session.runs || []).flatMap((run: any, runIndex: number) => {
            const runData = {
                ...baseData,
                run_number: runIndex + 1,
                elapsed_time_ms: run.elapsed_time_ms,
                distance_m: run.distance_m,
            };

            // Flatten gate runs data
            return (run.gate_runs || []).map((gateRun: any, gateIndex: number) => ({
                ...runData,
                gate_run_number: gateIndex + 1,
                reaction_time_ms: gateRun.reaction_time_ms,
                max_g: gateRun.max_g,
                avg_g: gateRun.avg_g,
                peak_speed_ms: gateRun.peak_speed_ms,
                avg_speed_ms: gateRun.avg_speed_ms_calc,
                time_to_peak_speed_ms: gateRun.time_to_peak_speed_ms,
                max_pitch_deg: gateRun.max_pitch_deg,
                front_wheel_lifted: gateRun.front_wheel_lifted ? 'Yes' : 'No',
                analytics_valid: gateRun.analytics_valid ? 'Yes' : 'No',
                bias_correction_ms2: gateRun.bias_correction_ms2,
            }));
        });
    });
}
