const hideWelcomeCheckbox = document.getElementById("hide_welcome_banner");
const DEFAULT_SETTINGS = {
    hide_welcome_banner: false,
};

let current_settings = DEFAULT_SETTINGS;

let settings = {};

// Gestion des modifications de la case à cocher
hideWelcomeCheckbox.onchange = () => {
    settings.hide_welcome_banner = hideWelcomeCheckbox.checked;
    setSettings(settings);
};

/**
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
function getSettings() {
    return new Promise((accept) => {
        chrome.storage.local.get(['Europresse_Companion_SETTINGS'], function (result) {
            if (result !== undefined) {
                current_settings = result.Europresse_Companion_SETTINGS;
                accept(current_settings);
            }
            else accept(DEFAULT_SETTINGS);
        });
    });
}

/**
 * @param {typeof DEFAULT_SETTINGS} settings
 */
function setSettings(settings) {
    chrome.storage.local.set(
        { ['Europresse_Companion_SETTINGS']: settings }
    );
}

function isNotAndroid() {
    return !/Android/.test(navigator.userAgent);
}

// Récupération des paramètres et initialisation de l'interface
getSettings().then((retrievedSettings) => {
    // ======== Si le navigateur fonctionne sous Android l'on ne montre pas l'option Cacher la bannière de bienvenue ========
    if (isNotAndroid()) {
        document.getElementById("hide_welcome_banner_label").style.display = "block";
    }
    settings = retrievedSettings;
    if (settings === undefined) settings = DEFAULT_SETTINGS;
    else
    {
        hideWelcomeCheckbox.checked = settings.hide_welcome_banner || false;
    }
});
