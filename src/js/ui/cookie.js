// src/js/ui/cookie.js
import { showToast } from './toast.js';
import { getTranslation } from '../core/state.js';

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

export function initializeCookieBanner() {
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieAccept = document.getElementById('cookie-accept');
    const cookieDecline = document.getElementById('cookie-decline');
    
    // If the banner is not on the page, do nothing.
    if (!cookieBanner) {
        return;
    }

    const cookieConsent = getCookie('cookieConsent');

    if (!cookieConsent) {
        cookieBanner.style.display = 'flex';
    }

    cookieAccept?.addEventListener('click', () => {
        setCookie('cookieConsent', 'accepted', 365);
        cookieBanner.style.display = 'none';
        // The toast and translation might not be available everywhere, so guard it.
        if (typeof showToast === 'function' && typeof getTranslation === 'function') {
            showToast(getTranslation('toast-cookies-accepted') || 'Cookies akzeptiert.');
        }
    });

    cookieDecline?.addEventListener('click', () => {
        setCookie('cookieConsent', 'declined', 365);
        cookieBanner.style.display = 'none';
    });
}
