/**
 * @fileoverview Utility functions for detecting OS and Browser information.
 */

/**
 * Detects the Operating System and Browser using User-Agent Client Hints
 * with a fallback to the User-Agent string.
 * This function does not interact with the DOM.
 *
 * @returns {Object} An object containing 'os', 'browser', and 'apiUsed' properties.
 * - os: The detected operating system (e.g., 'iOS', 'Windows', 'macOS').
 * - browser: An object containing:
 * - name: The detected browser's name (e.g., 'Chrome', 'Safari', 'Firefox').
 * - version: The detected browser's version (major version for UA-CH, 'Unknown' for User-Agent string fallback).
 * - apiUsed: The API used for detection ('User-Agent Client Hints' or 'User-Agent String').
 */
export default function detectDevice() {
    let os = 'Unknown OS';
    let browser = { name: 'Unknown Browser', version: 'Unknown' }; // Initialize browser as an object
    let apiUsed = 'Unknown API';
    // Get user agent string once and convert to lowercase for consistent comparisons
    const userAgentLower = navigator.userAgent.toLowerCase();

    // Check if User-Agent Client Hints API is available
    if (navigator.userAgentData) {
        // --- Using User-Agent Client Hints (Low-Entropy) ---
        apiUsed = 'User-Agent Client Hints';

        // 1. Detect Operating System using platform
        // Convert platform to lowercase for consistent comparison
        const platformLower = navigator.userAgentData.platform.toLowerCase();

        if (platformLower === 'macos') {
            os = 'macOS';
        } else if (platformLower === 'windows') {
            os = 'Windows';
        } else if (platformLower === 'android') {
            os = 'Android';
        } else if (platformLower === 'ios') {
            os = 'iOS';
        } else if (platformLower === 'linux') {
            os = 'Linux';
        } else {
            os = 'Unknown OS (via UA-CH)';
        }

        // 2. Detect Browser using brands array
        const brands = navigator.userAgentData.brands;
        if (brands && brands.length > 0) {
            let foundBrowser = false;
            for (const brand of brands) {
                // Convert brand name to lowercase for consistent comparison
                const brandNameLower = brand.brand.toLowerCase();
                const brandVer = brand.version; // Get version from UA-CH brand

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
                // Add more specific browser checks if needed
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

        // Refine iOS browser detection if platform is iOS, using the lowercased userAgent
        if (os === 'iOS') {
            // For iOS, UA-CH might not give specific browser names like Safari, Chrome (iOS).
            // We use userAgentLower for more specific browser identification on iOS.
            if (userAgentLower.includes('crios')) {
                browser.name = 'Chrome';
                // Attempt to extract version from userAgent string for iOS Chrome
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
                // Safari version is often tied to iOS version, or found after 'Version/'
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

        // 1. Detect Operating System (from original code), using the lowercased userAgent
        if (userAgentLower.includes('ipad') || userAgentLower.includes('iphone') || userAgentLower.includes('ipod')) {
            os = 'iOS';
        } else if (userAgentLower.includes('android')) {
            os = 'Android';
        } else if (userAgentLower.includes('macintosh') || userAgentLower.includes('mac os x')) {
            os = 'macOS';
        } else if (userAgentLower.includes('windows')) {
            os = 'Windows';
        } else if (userAgentLower.includes('linux')) {
            os = 'Linux';
        } else {
            os = 'Unknown OS (via User-Agent)';
        }

        // 2. Detect Browser (from original code), using the lowercased userAgent
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

    // Return the detected information as an object
    return { os, browser, apiUsed };
}