// ==UserScript==
// @name         Dual - Testing
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Loads the Dual Enhances interface and game script from GitHub Pages.
// @match        https://gota.io/web/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gota.io
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @connect      gylowlang.github.io
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================
    // SETTINGS
    // =========================================================

    const REPLACEMENT_BASE_URL =
        'https://gylowlang.github.io/sammy23/';

    const INDEX_URL =
        REPLACEMENT_BASE_URL + 'index.html';

    const STYLE_URL =
        REPLACEMENT_BASE_URL + 'style.css';

    const GOTA_CSS_URL =
        REPLACEMENT_BASE_URL + 'gota.css';

    const GAME_SCRIPT_URL =
        REPLACEMENT_BASE_URL + 'dual-enhances.js';

    const ORIGINAL_SCRIPT_NAME =
        'gota.js';

    const ORIGINAL_CSS_URL =
        '*://gota.io/web/style.css*';


    // =========================================================
    // LOGGING
    // =========================================================

    function log(message, ...args) {
        console.log('[DualEnhances]', message, ...args);
    }

    function error(message, ...args) {
        console.error('[DualEnhances]', message, ...args);
    }


    // =========================================================
    // PREPARE WINDOW
    // =========================================================

    try {
        Object.defineProperty(window, 'build', {
            configurable: true,
            writable: true,
            value: undefined
        });

        log('Window build variable prepared.');
    } catch (e) {
        error('Could not prepare window.build:', e);
    }


    // =========================================================
    // TEMPORARY VERSION VARIABLE
    // =========================================================

    function injectTemporaryVersion() {

        if (document.getElementById('temp-version-script')) {
            return;
        }

        try {

            const versionScript =
                document.createElement('script');

            versionScript.id =
                'temp-version-script';

            versionScript.textContent =
                'var version = "3.6.5";';

            (
                document.head ||
                document.documentElement
            ).appendChild(versionScript);

            log('Temporary version variable injected.');

        } catch (e) {

            error(
                'Failed to inject temporary version:',
                e
            );
        }
    }


    // =========================================================
    // REMOVE ORIGINAL GOTA.JS
    // =========================================================

    function setupScriptObserver() {

        const observer =
            new MutationObserver((mutations) => {

                for (const mutation of mutations) {

                    for (const node of mutation.addedNodes) {

                        if (!node || node.nodeType !== 1) {
                            continue;
                        }

                        if (
                            node.tagName === 'SCRIPT' &&
                            node.src &&
                            node.src.includes(ORIGINAL_SCRIPT_NAME)
                        ) {

                            log(
                                'Removing original Gota script:',
                                node.src
                            );

                            try {
                                node.remove();
                            } catch (e) {
                                error(
                                    'Could not remove original script:',
                                    e
                                );
                            }
                        }
                    }
                }
            });


        try {

            observer.observe(
                document.documentElement,
                {
                    childList: true,
                    subtree: true
                }
            );

            log('Original script observer started.');

        } catch (e) {

            error(
                'Failed to start script observer:',
                e
            );
        }
    }


    // =========================================================
    // REMOVE ORIGINAL GOTA CSS
    // =========================================================

    function removeOriginalCSS() {

        const links =
            document.querySelectorAll(
                'link[rel="stylesheet"]'
            );

        links.forEach((link) => {

            if (
                link.href &&
                link.href.includes('/web/style.css')
            ) {

                log(
                    'Removing original Gota CSS:',
                    link.href
                );

                try {
                    link.remove();
                } catch (e) {
                    error(
                        'Could not remove original CSS:',
                        e
                    );
                }
            }
        });
    }


    // =========================================================
    // INJECT CSS
    // =========================================================

    function injectCSS(url, id) {

        if (document.getElementById(id)) {
            return;
        }

        const link =
            document.createElement('link');

        link.id = id;
        link.rel = 'stylesheet';
        link.href = url;

        link.onload = () => {
            log('CSS loaded:', url);
        };

        link.onerror = () => {
            error('Failed to load CSS:', url);
        };

        (
            document.head ||
            document.documentElement
        ).appendChild(link);
    }


    // =========================================================
    // LOAD EXTERNAL HTML
    // =========================================================

    function loadHTML(url) {

        return new Promise((resolve, reject) => {

            log('Loading HTML:', url);

            GM_xmlhttpRequest({

                method: 'GET',

                url: url,

                nocache: true,

                timeout: 15000,

                onload: function (response) {

                    if (
                        response.status >= 200 &&
                        response.status < 300
                    ) {

                        log(
                            'HTML loaded successfully:',
                            response.status
                        );

                        resolve(response.responseText);

                    } else {

                        reject(
                            new Error(
                                'HTTP ' +
                                response.status +
                                ' ' +
                                response.statusText
                            )
                        );
                    }
                },

                onerror: function (response) {

                    reject(
                        new Error(
                            'Network error while loading ' +
                            url
                        )
                    );
                },

                ontimeout: function () {

                    reject(
                        new Error(
                            'Request timed out while loading ' +
                            url
                        )
                    );
                }
            });
        });
    }


    // =========================================================
    // LOAD REPLACEMENT GAME SCRIPT
    // =========================================================

    function replaceScript(url) {

        return new Promise((resolve, reject) => {

            if (!url) {

                reject(
                    new Error(
                        'Replacement script URL is empty.'
                    )
                );

                return;
            }

            log(
                'Loading replacement game script:',
                url
            );


            const script =
                document.createElement('script');

            script.src = url;

            script.async = false;


            script.onload = () => {

                log(
                    'Replacement game script loaded.'
                );

                cleanupTemporaryVersion();

                resolve();

            };


            script.onerror = (event) => {

                error(
                    'Failed to load replacement game script:',
                    url,
                    event
                );

                cleanupTemporaryVersion();

                reject(
                    new Error(
                        'Could not load dual-enhances.js'
                    )
                );
            };


            (
                document.head ||
                document.documentElement
            ).appendChild(script);
        });
    }


    // =========================================================
    // REMOVE TEMPORARY VERSION SCRIPT
    // =========================================================

    function cleanupTemporaryVersion() {

        const element =
            document.getElementById(
                'temp-version-script'
            );

        if (!element) {
            return;
        }

        try {

            element.remove();

            log(
                'Temporary version script removed.'
            );

        } catch (e) {

            error(
                'Could not remove temporary version:',
                e
            );
        }
    }


    // =========================================================
    // MAIN LOADER
    // =========================================================

    async function startDualEnhances() {

        log('Starting Dual Enhances...');

        try {

            // -------------------------------------------------
            // Make sure the page has a body
            // -------------------------------------------------

            if (!document.body) {

                await new Promise((resolve) => {

                    if (document.readyState === 'loading') {

                        document.addEventListener(
                            'DOMContentLoaded',
                            resolve,
                            { once: true }
                        );

                    } else {

                        resolve();
                    }
                });
            }


            // -------------------------------------------------
            // Remove original CSS
            // -------------------------------------------------

            removeOriginalCSS();


            // -------------------------------------------------
            // Load replacement CSS
            // -------------------------------------------------

            // Game CSS
            injectCSS(
                GOTA_CSS_URL,
                'dual-gota-css'
            );

            // Dual Enhances UI CSS
            injectCSS(
                STYLE_URL,
                'dual-style-css'
            );


            // -------------------------------------------------
            // Prevent drag/drop
            // -------------------------------------------------

            document.ondragstart =
                () => false;

            document.ondrop =
                () => false;


            // -------------------------------------------------
            // Download index.html
            // -------------------------------------------------

            const newHTML =
                await loadHTML(INDEX_URL);


            if (!newHTML) {

                throw new Error(
                    'index.html returned empty content.'
                );
            }


            // -------------------------------------------------
            // Replace page body
            // -------------------------------------------------

            document.body.innerHTML =
                '<div id="dual-enhances-wrapper">' +
                newHTML +
                '</div>';


            log(
                'Dual Enhances HTML inserted.'
            );


            // -------------------------------------------------
            // Load main JavaScript
            // -------------------------------------------------

            await replaceScript(
                GAME_SCRIPT_URL
            );


            log(
                'Dual Enhances initialization complete.'
            );


        } catch (e) {

            error(
                'Dual Enhances failed to initialize:',
                e
            );

            console.error(e);


            // Show a simple error message
            // without stopping the entire browser page.

            const errorBox =
                document.createElement('div');

            errorBox.style.position =
                'fixed';

            errorBox.style.top =
                '20px';

            errorBox.style.left =
                '20px';

            errorBox.style.right =
                '20px';

            errorBox.style.padding =
                '15px';

            errorBox.style.zIndex =
                '2147483647';

            errorBox.style.background =
                '#222';

            errorBox.style.color =
                '#fff';

            errorBox.style.fontFamily =
                'Arial, sans-serif';

            errorBox.textContent =
                'Dual Enhances failed to load. Check the browser console for details.';

            document.body.appendChild(
                errorBox
            );
        }
    }


    // =========================================================
    // START
    // =========================================================

    setupScriptObserver();

    injectTemporaryVersion();


    if (
        document.readyState === 'loading'
    ) {

        window.addEventListener(
            'DOMContentLoaded',
            startDualEnhances,
            { once: true }
        );

    } else {

        startDualEnhances();
    }

})();
