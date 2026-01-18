/**
 * src/js/core/flow_manager.js
 * Manages the linear 3-phase workflow
 */

import { setPhase, FLOW_PHASES, getTier, USER_TIERS } from './state.js';
import { showToast } from '../ui/toast.js';

export class FlowManager {
    constructor() {
        this.phases = [FLOW_PHASES.SEARCH, FLOW_PHASES.ANALYSIS, FLOW_PHASES.EDITOR];
        this.initSidebar();
    }

    /**
     * Navigates to a specific phase if requirements are met
     */
    async navigateTo(targetPhase) {
        const tier = getTier();
        
        // Expert Check
        if (targetPhase === FLOW_PHASES.EDITOR && tier !== USER_TIERS.EXPERT) {
            showToast('Editor-Modus erfordert Experten-Status.', 'warning');
            return;
        }

        console.log(`[Flow] Navigating to ${targetPhase}`);
        setPhase(targetPhase);
        this.updateUI();
    }

    /**
     * Updates the visibility of phase containers and sidebar badges
     */
    updateUI() {
        const currentPhase = document.querySelector('.phase-active');
        if (currentPhase) currentPhase.classList.remove('phase-active');

        const activePhase = document.getElementById(setPhase.currentPhase || FLOW_PHASES.SEARCH);
        // Note: We use the DOM IDs directly corresponding to FLOW_PHASES
        this.phases.forEach(p => {
            const el = document.getElementById(p);
            if (el) el.style.display = (p === activePhase?.id) ? 'block' : 'none';
        });

        this.updateSidebar();
    }

    initSidebar() {
        const sidebar = document.getElementById('workflow-nav');
        if (!sidebar) return;

        sidebar.innerHTML = `
            <div class="flow-step" data-phase="${FLOW_PHASES.SEARCH}">1. Suche</div>
            <div class="flow-step" data-phase="${FLOW_PHASES.ANALYSIS}">2. Analyse</div>
            <div class="flow-step" data-phase="${FLOW_PHASES.EDITOR}">3. Editor</div>
        `;

        sidebar.querySelectorAll('.flow-step').forEach(step => {
            step.addEventListener('click', () => this.navigateTo(step.dataset.phase));
        });
    }

    updateSidebar() {
        // Implementation for highlighting active step
    }
}

export const flow = new FlowManager();
