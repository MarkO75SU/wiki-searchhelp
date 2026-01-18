// src/js/services/database.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { CONFIG } from '../config/config.js';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

/**
 * Saves analysis results to the analysis_logs table.
 * @param {object} report - The report data containing drift, health, and global scores.
 */
export async function saveTestReport(report) {
    try {
        const { data, error } = await supabase
            .from('analysis_logs')
            .insert([
                {
                    search_query: report.query,
                    drift_score: report.driftScore,
                    health_score: report.healthScore,
                    global_score: report.globalScore,
                    results_count: report.resultsCount,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;
        console.log('[Database] Analysis log saved successfully:', data);
        return data;
    } catch (err) {
        console.error('[Database] Error saving analysis log:', err.message);
        return null;
    }
}

/**
 * Fetches the history of analysis logs.
 */
export async function getTestHistory() {
    try {
        const { data, error } = await supabase
            .from('analysis_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('[Database] Error fetching history:', err.message);
        return [];
    }
}

export { supabase };