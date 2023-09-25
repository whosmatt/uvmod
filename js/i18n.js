i18next.use(i18nextBrowserLanguageDetector).use(i18nextHttpBackend).init({
    detection: { caches: [] },
    fallbackLng: 'en',
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    debug: true,
    backend: {
        loadPath: 'locales/{{lng}}/{{ns}}.json'
    }
}, function (err, t) {
    updateLocalization();
});

// function to update static html elements
function updateLocalization() {
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        // check if a data-i18n-options attribute is present
        if (node.dataset.i18nOptions) {
            // parse the options
            const options = JSON.parse(node.dataset.i18nOptions);
            // translate the node
            node.innerHTML = i18next.t(node.dataset.i18n, options);
        } else {
            node.innerHTML = i18next.t(node.dataset.i18n);
        }
    });
}

/**
 * Returns a translated string from the active translation file.
 * @param {...any} params - The parameters to pass to i18next.t
 * @example t("mod.batteryIcon.name") // Returns the translated name for the battery icon mod
 * @example t("mod.common.flash-usage", { size: mod.size }) // Returns the translated string with interpolation
 * @returns {string} - The translated string
 */
const t = (...args) => i18next.t(...args);