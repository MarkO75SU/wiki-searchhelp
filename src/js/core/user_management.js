/**
 * src/js/core/user_management.js
 * Logic for Verified Editor Status and Tiering
 */

import { fetchUserEditCount } from '../services/wiki_service.js';
import { setTier, USER_TIERS } from './state.js';
import { showToast } from '../ui/toast.js';

const EXPERT_THRESHOLD = 5000;

export async function verifyUserStatus(wikiUsername) {
    if (!wikiUsername) return;

    try {
        console.log(`[User] Verifying status for ${wikiUsername}...`);
        const editCount = await fetchUserEditCount(wikiUsername);
        
        if (editCount >= EXPERT_THRESHOLD) {
            setTier(USER_TIERS.EXPERT);
            showToast(`Status verifiziert: EXPERTE (${editCount} Edits)`, 'success');
        } else if (editCount > 0) {
            setTier(USER_TIERS.ADVANCED);
            showToast(`Status: FORTGESCHRITTEN (${editCount} Edits)`, 'info');
        } else {
            setTier(USER_TIERS.FREE);
            showToast('Einfacher Nutzer-Status.', 'info');
        }
        
        return editCount;
    } catch (e) {
        console.error('Verification failed:', e);
        return 0;
    }
}
