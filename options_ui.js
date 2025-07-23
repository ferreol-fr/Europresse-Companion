const hideWelcomeCheckbox = document.getElementById("hide_welcome_banner");
const exportDataButton = document.getElementById("export_data");
const importDataButton = document.getElementById("import_data");
const import_fileInput = document.getElementById('import_fileInput');
const importDiv = document.getElementById('import_div');
const addToSearch = document.getElementById('add_to_search');
const replaceExistingSearch = document.getElementById('replace_existing_search');
const isAndroid = /Android/.test(navigator.userAgent);
let fileToImport = false;
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

exportDataButton.onclick= () => {
    chrome.storage.local.get(['menuItems'], function (result) {
        if (result !== undefined) {
            const data = JSON.stringify(result);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: 'Europresse_Companion_datta.json',
                saveAs: true
            });
        }
    });
}

import_fileInput.addEventListener('change', function (e) {
    fileToImport = e.target.files[0];
    importDiv.style.display = "block";
})

importDataButton.onclick= () => {
    console.log("analyse du JSON :",fileToImport);
    if (!fileToImport) {
        return;
    }
    const reader = new FileReader();
    reader.readAsText(fileToImport);
    reader.onload = function(e) {
        const contents = e.target.result.toString();
        try {
            const json = JSON.parse(contents);
            console.log('Fichier JSON importé :',contents, json);
            if (replaceExistingSearch.checked) {
            chrome.storage.local.set(json, function () {
                console.log('Menu items saved', json);
            });
            } else {
                chrome.storage.local.get(['menuItems'], function (result) {
                    if (result !== undefined) {
                        let menuItems = result.menuItems || [];
                        menuItems = menuItems.concat(json.menuItems);
                        chrome.storage.local.set({menuItems: menuItems}, function () {
                            console.log('Menu items saved', menuItems);
                        });
                    }

                })
            }
        } catch (error) {
            console.error("Erreur lors de l'analyse du JSON :", error);
            alert("Erreur lors de l'analyse du JSON.");
        }
    };
    fileToImport = false;
    importDiv.style.display = "none";

}


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



// Récupération des paramètres et initialisation de l'interface
getSettings().then((retrievedSettings) => {
    // ======== Si le navigateur fonctionne sous Android l'on ne montre pas l'option Cacher la bannière de bienvenue ========
    if (!isAndroid) {
        document.getElementById("hide_welcome_banner_label").style.display = "block";
    }
    settings = retrievedSettings;
    if (settings === undefined) settings = DEFAULT_SETTINGS;
    else
    {
        hideWelcomeCheckbox.checked = settings.hide_welcome_banner || false;
    }
});
