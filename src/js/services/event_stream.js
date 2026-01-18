/**
 * src/js/services/event_stream.js
 * Real-time Monitoring via Wikimedia EventStreams (SSE)
 */

import { showToast } from '../ui/toast.js';

export class EventStreamService {
    constructor() {
        this.source = null;
    }

    /**
     * Listens to new category creation events
     */
    startMonitoring(callback) {
        if (this.source) return;

        console.log('[EventStream] Connecting to Wikimedia stream...');
        this.source = new EventSource('https://stream.wikimedia.org/v2/stream/recentchange');

        this.source.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Filter for new categories (Namespace 14) in German/English Wiki
            if (data.type === 'new' && data.namespace === 14 && (data.wiki === 'dewiki' || data.wiki === 'enwiki')) {
                console.log('[EventStream] New Category detected:', data.title);
                if (callback) callback(data);
            }
        };

        this.source.onerror = () => {
            console.warn('[EventStream] Connection lost. Retrying...');
        };
    }

    stopMonitoring() {
        if (this.source) {
            this.source.close();
            this.source = null;
        }
    }
}

export const eventStream = new EventStreamService();
