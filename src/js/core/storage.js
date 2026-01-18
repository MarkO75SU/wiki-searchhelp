/**
 * src/js/core/storage.js
 * Smart Storage Manager with Offline Queue
 */

import { PERSISTENCE_CONFIG } from '../config/constants.js';
import { saveTestReport } from '../services/database.js';

class StorageManager {
    constructor() {
        this.queue = JSON.parse(localStorage.getItem(PERSISTENCE_CONFIG.OFFLINE_QUEUE_KEY) || '[]');
        this.initAutoSync();
    }

    /**
     * Saves data with high reliability
     */
    async logResult(report) {
        const success = await saveTestReport(report);
        
        if (!success) {
            console.warn('[STORAGE] App offline or DB error. Queuing log...');
            this.queue.push({ ...report, queued_at: new Date().toISOString() });
            this.saveQueue();
        }
    }

    saveQueue() {
        localStorage.setItem(PERSISTENCE_CONFIG.OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    }

    /**
     * Periodically checks if queue can be cleared
     */
    initAutoSync() {
        window.addEventListener('online', () => this.processQueue());
        setInterval(() => this.processQueue(), 60000); // Check every min
    }

    async processQueue() {
        if (!this.queue.length || !navigator.onLine) return;

        console.log(`[STORAGE] Syncing ${this.queue.length} items from offline queue...`);
        const item = this.queue[0];
        
        const success = await saveTestReport(item);
        if (success) {
            this.queue.shift();
            this.saveQueue();
            this.processQueue(); // Recursive sync
        }
    }
}

export const storage = new StorageManager();
