/**
 * @fileoverview Utility functions for detecting OS and Browser information.
 */

type DeviceInfo = {
    os: string;
    browser: {
        name: string;
        version: string;
    };
    isStandalone: boolean;
    isDesktop: boolean;
    apiUsed: string;
}

/**
 * A private variable to store the cached device information.
 * It will be null until the first call to detectDevice().
 * @type {Object|null}
 */
let _cachedDeviceInfo: DeviceInfo | null = null;

/**
 * Detects the Operating System, Browser information, and Standalone mode status.
 * Uses User-Agent Client Hints with a fallback to the User-Agent string.
 * This function does not interact with the DOM.
 *
 * This function caches its result after the first call. Subsequent calls will
 * return the cached information without re-detecting.
 *
 * @returns {Object} An object containing 'os', 'browser', 'isStandalone', 'isDesktop', and 'apiUsed' properties.
 * - os: The detected operating system (e.g., 'iOS', 'Windows', 'macOS').
 * - browser: An object containing:
 * - name: The detected browser's name (e.g., 'Chrome', 'Safari', 'Firefox').
 * - version: The detected browser's version (major version for UA-CH, 'Unknown' for User-Agent string fallback).
 * - isStandalone: A boolean indicating if the app is running in standalone mode (e.g., PWA, iOS Home Screen app).
 * - isDesktop: A boolean indicating if the device is likely a desktop or laptop.
 * - apiUsed: The API used for detection ('User-Agent Client Hints' or 'User-Agent String').
 */
export default function detectDevice(): DeviceInfo {
    // If device information is already cached, return it immediately.
    if (_cachedDeviceInfo) {
        return _cachedDeviceInfo;
    }

    let os = 'Unknown OS';
    let browser = { name: 'Unknown Browser', version: 'Unknown' };
    let isStandalone = false;
    let isDesktop = false;
    let apiUsed = 'Unknown API';
    // Get user agent string once and convert to lowercase for consistent comparisons
    const userAgentLower = navigator.userAgent.toLowerCase();

    // Determine standalone mode
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        isStandalone = true;
    }
    else if ((navigator as any).standalone) {
        isStandalone = true;
    }

    // A list of keywords commonly found in mobile user agents
    const mobileKeywords = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

    // Check if User-Agent Client Hints API is available
    if ((navigator as any).userAgentData) {
        // --- Using User-Agent Client Hints (Low-Entropy) ---
        apiUsed = 'User-Agent Client Hints';

        // 1. Detect Operating System using platform
        const platformLower = (navigator as any).userAgentData.platform.toLowerCase();

        if (platformLower === 'macos') {
            os = 'macOS';
            isDesktop = true;
        } else if (platformLower === 'windows') {
            os = 'Windows';
            isDesktop = true;
        } else if (platformLower === 'android') {
            os = 'Android';
            isDesktop = false;
        } else if (platformLower === 'ios') {
            os = 'iOS';
            isDesktop = false;
        } else if (platformLower === 'linux') {
            os = 'Linux';

            if (!mobileKeywords.test(userAgentLower)) {
                isDesktop = true;
            }
        } else {
            os = 'Unknown OS (via UA-CH)';
            // If the platform is unknown, we check for other signs.
            if (!mobileKeywords.test(userAgentLower) && !('ontouchstart' in window || (navigator as any).maxTouchPoints > 0)) {
                isDesktop = true;
            }
        }

        // Use the `mobile` boolean from User-Agent Client Hints if available
        if (typeof (navigator as any).userAgentData.mobile === 'boolean') {
            isDesktop = !(navigator as any).userAgentData.mobile;
        }

        // 2. Detect Browser using brands array
        const brands = (navigator as any).userAgentData.brands;
        if (brands && brands.length > 0) {
            let foundBrowser = false;
            for (const brand of brands) {
                const brandNameLower = brand.brand.toLowerCase();
                const brandVer = brand.version;

                if (brandNameLower.includes('chrome') && !brandNameLower.includes('chromium')) {
                    browser.name = 'Chrome';
                    browser.version = brandVer;
                    foundBrowser = true;
                    break;
                } else if (brandNameLower.includes('firefox')) {
                    browser.name = 'Firefox';
                    browser.version = brandVer;
                    foundBrowser = true;
                    break;
                } else if (brandNameLower.includes('edge')) {
                    browser.name = 'Edge';
                    browser.version = brandVer;
                    foundBrowser = true;
                    break;
                } else if (brandNameLower.includes('safari')) {
                    browser.name = 'Safari';
                    browser.version = brandVer;
                    foundBrowser = true;
                    break;
                }
            }

            if (!foundBrowser && brands[0] && brands[0].brand) {
                browser.name = brands[0].brand;
                browser.version = brands[0].version;
            } else if (!foundBrowser) {
                browser.name = 'Unknown Browser (via UA-CH)';
                browser.version = 'Unknown';
            }
        } else {
            browser.name = 'Unknown Browser (via UA-CH)';
            browser.version = 'Unknown';
        }

        // Refine iOS browser detection
        if (os === 'iOS') {
            // For iOS, UA-CH might not give specific browser names like Safari, Chrome (iOS).
            // We use userAgentLower for more specific browser identification on iOS.
            if (userAgentLower.includes('crios')) {
                browser.name = 'Chrome';
                const match = userAgentLower.match(/crios\/(\d+\.\d+\.\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('fxios')) {
                browser.name = 'Firefox';
                const match = userAgentLower.match(/fxios\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('edgios')) {
                browser.name = 'Edge';
                const match = userAgentLower.match(/edgios\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('safari') && !userAgentLower.includes('chrome') && !userAgentLower.includes('crios') && !userAgentLower.includes('fxios') && !userAgentLower.includes('edgios')) {
                browser.name = 'Safari';
                const match = userAgentLower.match(/version\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('opera mini')) {
                browser.name = 'Opera Mini';
                const match = userAgentLower.match(/opera mini\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (browser.name.includes('Unknown Browser')) {
                browser.name = 'Other Browser';
                browser.version = 'Unknown';
            }
        }

    } else {
        // --- Fallback to User-Agent String Parsing ---
        apiUsed = 'User-Agent String';
        console.warn("navigator.userAgentData not supported. Falling back to userAgent string parsing.");

        // 1. Detect Operating System and Desktop status
        if (userAgentLower.includes('ipad') || userAgentLower.includes('iphone') || userAgentLower.includes('ipod')) {
            os = 'iOS';
            isDesktop = false;
        } else if (userAgentLower.includes('android')) {
            os = 'Android';
            isDesktop = false;
        } else if (userAgentLower.includes('macintosh') || userAgentLower.includes('mac os x')) {
            os = 'macOS';
            isDesktop = true;
        } else if (userAgentLower.includes('windows')) {
            os = 'Windows';
            isDesktop = true;
        } else if (userAgentLower.includes('linux')) {
            os = 'Linux';
            // Linux can be desktop, so we check for mobile keywords.
            isDesktop = !mobileKeywords.test(userAgentLower);
        } else {
            os = 'Unknown OS (via User-Agent)';
            // If OS is unknown, rely on the absence of mobile keywords.
            isDesktop = !mobileKeywords.test(userAgentLower);
        }

        // Further refine desktop detection for touch screens
        // A desktop can have a touchscreen, but a mobile device almost always does.
        // So, if it has a touchscreen AND it's not a known desktop OS, it's probably not a desktop.
        const hasTouchSupport = 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0;
        if (hasTouchSupport && os !== 'Windows' && os !== 'macOS') {
            // This is a weak signal, but helps for ambiguous cases like Linux tablets.
            isDesktop = false;
        }

        // 2. Detect Browser
        if (os === 'iOS') {
            if (userAgentLower.includes('crios')) {
                browser.name = 'Chrome';
                const match = userAgentLower.match(/crios\/(\d+\.\d+\.\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('fxios')) {
                browser.name = 'Firefox';
                const match = userAgentLower.match(/fxios\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('edgios')) {
                browser.name = 'Edge';
                const match = userAgentLower.match(/edgios\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('safari') && !userAgentLower.includes('chrome') && !userAgentLower.includes('crios') && !userAgentLower.includes('fxios') && !userAgentLower.includes('edgios')) {
                browser.name = 'Safari';
                const match = userAgentLower.match(/version\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('opera mini')) {
                browser.name = 'Opera Mini';
                const match = userAgentLower.match(/opera mini\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else {
                browser.name = 'Other Browser';
                browser.version = 'Unknown';
            }
        } else {
            // General browser detection for non-iOS platforms
            if (userAgentLower.includes('chrome') && !userAgentLower.includes('edge') && !userAgentLower.includes('edg') && !userAgentLower.includes('opr') && !userAgentLower.includes('opera')) {
                browser.name = 'Chrome';
                const match = userAgentLower.match(/(?:chrome|crios|chromium)\/(\d+\.\d+\.\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('firefox')) {
                browser.name = 'Firefox';
                const match = userAgentLower.match(/firefox\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('safari') && !userAgentLower.includes('chrome')) {
                browser.name = 'Safari';
                const match = userAgentLower.match(/version\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('edge') || userAgentLower.includes('edg')) {
                browser.name = 'Edge';
                const match = userAgentLower.match(/(?:edge|edg)\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('opera') || userAgentLower.includes('opr')) {
                browser.name = 'Opera';
                const match = userAgentLower.match(/(?:opera|opr)\/(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else if (userAgentLower.includes('msie') || userAgentLower.includes('trident')) {
                browser.name = 'Internet Explorer';
                const match = userAgentLower.match(/(?:msie |rv:)(\d+\.\d+)/);
                if (match && match[1]) browser.version = match[1];
            } else {
                browser.name = 'Unknown Browser (via User-Agent)';
                browser.version = 'Unknown';
            }
        }
    }

    _cachedDeviceInfo = { os, browser, isStandalone, isDesktop, apiUsed };
    return _cachedDeviceInfo;
}