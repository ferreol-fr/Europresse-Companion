let settings = {};

function getSettings() {
    return new Promise((accept) => {
        chrome.storage.local.get(['Europresse_Companion_SETTINGS'], function (result) {
            if (result.Europresse_Companion_SETTINGS !== undefined) {
                settings = result.Europresse_Companion_SETTINGS;
                accept(settings);
            }
            else accept(false);
        });
    });
}

function createMenu() {
    const path = window.location.pathname;
    if (path.startsWith("/Login")) return;

    let isEdited = false;


    if (/Android/.test(navigator.userAgent)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('styles/android-styles.css');
        document.getElementById('logoIcon').style.display = 'none';
        document.querySelector('span[title="FACIL\'iti"]').style.display = 'none';
        document.head.appendChild(link);
    } else {
        if (settings !== false && settings.hide_welcome_banner === true) {
            console.log("hide_welcome_banner");
            document.getElementById('welcomeText').remove();
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('styles/default-styles.css');
        document.head.appendChild(link);
    }

    // Le choix de tris ne peut être éffectuer qu'après chargement de la page
    if (path.startsWith("/Search/Result")) {
        chrome.storage.local.get(['ddlSortChose'], function (result) {
            const sortChoice = result.ddlSortChose || false;
            if (sortChoice !== false) {
                document.getElementById('ddlSort').value = sortChoice;
                chrome.storage.local.set({ddlSortChose: false}, function () {
                });
            }
        });
    }

    // Créer le conteneur du menu
    const menuContainer = document.createElement('div');
    menuContainer.id = 'my-ext-dropdown-menu-container';
    menuContainer.innerHTML = `
    <div class="my-ext-dropdown-menu">
      <button class="my-ext-dropdown-button" title="Mes Recherches">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"  viewBox="0 0 20 20">
      <path d="m17.5 11c2.484 0 4.5 2.016 4.5 4.5s-2.016 4.5-4.5 4.5-4.5-2.016-4.5-4.5 2.016-4.5 4.5-4.5zm-5.979 5c.043.522.153 1.025.321 1.5h-9.092c-.414 0-.75-.336-.75-.75s.336-.75.75-.75zm3.704-.024 1.442 1.285c.095.085.215.127.333.127.136 0 .271-.055.37-.162l2.441-2.669c.088-.096.131-.217.131-.336 0-.274-.221-.499-.5-.499-.136 0-.271.055-.37.162l-2.108 2.304-1.073-.956c-.096-.085-.214-.127-.333-.127-.277 0-.5.224-.5.499 0 .137.056.273.167.372zm-2.598-3.976c-.328.456-.594.96-.785 1.5h-9.092c-.414 0-.75-.336-.75-.75s.336-.75.75-.75zm7.373-3.25c0-.414-.336-.75-.75-.75h-16.5c-.414 0-.75.336-.75.75s.336.75.75.75h16.5c.414 0 .75-.336.75-.75zm0-4c0-.414-.336-.75-.75-.75h-16.5c-.414 0-.75.336-.75.75s.336.75.75.75h16.5c.414 0 .75-.336.75-.75z" fill-rule="nonzero"/></svg></button>
      <ul class="my-ext-menu-list">
      
        <li class="my-ext-menu-search-container">
          <input type="text" class="my-ext-menu-search" placeholder="Rechercher...">
        </li>
        <div class="my-ext-no-results">Aucun résultat trouvé</div>
        <!-- Les éléments du menu seront ajoutés ici -->
      </ul>
      <button class="my-ext-add-button" title="Ajouter un élément">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
        <path d="m20 20h-15.25c-.414 0-.75.336-.75.75s.336.75.75.75h15.75c.53 0 1-.47 1-1v-15.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75zm-1-17c0-.478-.379-1-1-1h-15c-.62 0-1 .519-1 1v15c0 .621.52 1 1 1h15c.478 0 1-.379 1-1zm-15.5.5h14v14h-14zm6.25 6.25h-3c-.414 0-.75.336-.75.75s.336.75.75.75h3v3c0 .414.336.75.75.75s.75-.336.75-.75v-3h3c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-3v-3c0-.414-.336-.75-.75-.75s-.75.336-.75.75z" fill-rule="nonzero"/></svg>
        </button>
    </div>
  `;

    // Ajouter le conteneur au corps de la page
    document.getElementById('nav').insertBefore(menuContainer, document.getElementById('logoIcon'));

    // Récupérer les éléments du DOM
    const menuList = menuContainer.querySelector('.my-ext-menu-list');
    const searchInput = menuContainer.querySelector('.my-ext-menu-search');
    const noResultsMessage = menuContainer.querySelector('.my-ext-no-results');

    // Charger les éléments du menu depuis le stockage local
    chrome.storage.local.get(['menuItems'], function (result) {
        const menuItems = result.menuItems || [];
        renderMenuItems(menuItems);
    });

    // Fonction pour rendre les éléments du menu
    function renderMenuItems(items) {
        // Effacer les éléments existants (sauf le champ de recherche et le message)
        const existingItems = menuList.querySelectorAll('.my-ext-menu-item');
        existingItems.forEach(item => item.remove());

        // Ajouter les nouveaux éléments
        items.forEach(item => {
            let criteriaSet = item.criteriaSet;
            let dateRange = item.dateRange;
            let criteriaExp = item.criteriaExp;
            let ddlSort = item.sort;

            console.log("criteriaExp", criteriaExp);
            const menuItem = renderMenuItem(item.text, criteriaSet, dateRange, ddlSort, criteriaExp);
            menuList.insertBefore(menuItem, noResultsMessage);
        });

        // Masquer le message "Aucun résultat" s'il y a des éléments
        noResultsMessage.style.display = items.length > 0 ? 'none' : 'block';
    }

    // Gérer l'affichage/masquage du menu
    menuContainer.querySelector('.my-ext-dropdown-button').addEventListener('click', function () {

        if (!/Android/.test(navigator.userAgent)) {
            chrome.storage.local.get(['menuListSize'], function (result) {
                if (result.length === undefined) return;
                if (result.menuListSize.width !== undefined) {
                    if (window.innerWidth - 2 >= Number(result.menuListSize.width.replace("px", ""))) {
                        menuList.style.width = result.menuListSize.width;
                    } else {
                        menuList.style.width = window.innerWidth - 2 + "px";
                    }
                    if (window.innerHeight - 2 >= Number(result.menuListSize.height.replace("px", ""))) {
                        menuList.style.height = result.menuListSize.height;
                    } else {
                        menuList.style.height = window.innerHeight - 2 + "px";
                    }

                }
            });
        }
        menuList.classList.toggle('show');
        if (menuList.classList.contains('show')) {
            searchInput.focus();
        }

    });

    // Fermer le menu lorsqu'on clique à l'extérieur
    document.addEventListener('click', function (e) {
        if (!menuContainer.contains(e.target) && !isEdited) {
            if (!/Android/.test(navigator.userAgent) && menuList.style.width !== "") {
                let menuListSize = {};
                menuListSize.width = menuList.style.width;
                menuListSize.height = menuList.style.height;
                chrome.storage.local.set({menuListSize: menuListSize}, function () {
                });
            }
            menuList.classList.remove('show');
        }
        // isEdited = false; contre intuitif mais nécessaire
        isEdited = false;
    });

    // Gérer la recherche
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        const menuItems = menuList.querySelectorAll('.my-ext-menu-item');
        let hasVisibleItems = false;

        menuItems.forEach(item => {
            const text = item.querySelector('.my-ext-content-button').textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.classList.remove('hidden');
                hasVisibleItems = true;
            } else {
                item.classList.add('hidden');
            }
        });

        // Afficher ou masquer le message "Aucun résultat"
        noResultsMessage.style.display = hasVisibleItems ? 'none' : 'block';
    });

    // Gérer l'ajout d'un élément
    menuContainer.querySelector('.my-ext-add-button').addEventListener('click', function () {

        let newItemText = document.getElementById('Keywords').value;
        let newItemCriteriaSet = document.getElementById('CriteriaSet').outerHTML;
        let newItemDateRange = document.getElementById('DateRange').outerHTML;
        let ddlSort = document.getElementById('ddlSort').outerHTML;
        let newItemCriteriaExp = document.querySelectorAll('input[type="hidden"][name^="CriteriaExp["]');
        let criteriaExpHtml = '';
        if (newItemCriteriaExp.length === 0) {
            newItemCriteriaExp = "";
        } else {
            newItemCriteriaExp.forEach(exp => {
                criteriaExpHtml += exp.outerHTML;
            });
        }
        console.log('newItemCriteriaExp', newItemCriteriaExp);
        if (newItemText || newItemCriteriaSet) {
            chrome.storage.local.get(['menuItems',], function (result) {
                const menuItems = result.menuItems || [];
                menuItems.unshift({
                    text: newItemText,
                    criteriaSet: newItemCriteriaSet.replace(`id="CriteriaSet"`, ""),
                    dateRange: newItemDateRange.replace(`id="DateRange"`, ""),
                    sort: ddlSort.replace(`id="ddlSort"`, ""),
                    criteriaExp: criteriaExpHtml
                });
                saveMenuItems(menuItems);
            });
        }
    });

    // Fonction pour sauvegarder les éléments du menu
    function saveMenuItems(items) {
        chrome.storage.local.set({menuItems: items}, function () {
            console.log('Menu items saved', items);
            // Recharger les éléments après sauvegarde
            renderMenuItems(items);
        });
    }

    // Gérer les autres événements (délégation d'événements)
    let selectModified = false;
    menuList.addEventListener('change', function (e) {
        console.log("change", e.target, selectModified);
        let target = e.target.closest('select');
        if (target) {
            selectModified = target;
            const selectedIndex = selectModified.selectedIndex;
            const length = selectModified.options.length;
            for (let i = 0; i < length; i++) {
                selectModified.options[i].removeAttribute('selected');
            }
            selectModified.options[selectedIndex].setAttribute('selected', 'selected');
        }
    });

    menuList.addEventListener('click', function (e) {

        let target = e.target.closest('button');

        if (!target && selectModified !== false) {
            target = selectModified;
        }
        let menuItem;
        if (target) {
            try {
                menuItem = target.closest('.my-ext-menu-item');
            } catch (err) {

            }
        }
        if (!menuItem) return;
        console.log("target", target, e, isEdited, selectModified);

        //l'utilisateur lance une recherche sauvegardée
        if (target.classList.contains('my-ext-content-button')) {
            let menuText = menuItem.querySelector('.my-ext-content-button');
            let criteriaSet = menuItem.querySelector('select[name="CriteriaSet"]');
            let dateRange = menuItem.querySelector('select[name="DateFilter.DateRange"]');
            let ddlSort = menuItem.querySelector('select[name="Sort"]');
            if (ddlSort.value !== "1") {
                chrome.storage.local.set({ddlSortChose: ddlSort.value}, function () {
                });
            }
            let criteriaExp = menuItem.querySelectorAll('input[type="hidden"][name^="CriteriaExp["]');
            document.getElementById('Keywords').value = menuText.textContent;
            if (document.getElementById('DateRange')) {
                document.getElementById('DateRange').value = dateRange.value;
            } else {
                document.getElementById('DateFilter_DateRange').value = dateRange.value;
            }
            //document.getElementById('ddlSort').value = ddlSort.value;
            if (criteriaSet.value === "-1") {
                let form = document.querySelector('form');
                let oldCriteriaExp = form.querySelectorAll('input[type="hidden"][name^="CriteriaExp["]');
                for (const exp of oldCriteriaExp) {
                    form.removeChild(exp);
                }
                for (const exp of criteriaExp) {
                    form.appendChild(exp);
                }
                let oldCriteriaSet = document.getElementById('CriteriaSet');
                if (oldCriteriaSet.value === "-1") {
                    oldCriteriaSet.options.remove(oldCriteriaSet.selectedIndex);
                }
                let newCriteriaSet = new Option(criteriaSet.options[criteriaSet.selectedIndex].text, criteriaSet.value);
                newCriteriaSet.title = criteriaSet.options[criteriaSet.selectedIndex].title;
                oldCriteriaSet.add(newCriteriaSet);
                oldCriteriaSet.value = criteriaSet.value;

            } else {
                document.getElementById('CriteriaSet').value = criteriaSet.value;
            }
            document.getElementById('btnSearch').click();
        }


        if (!menuItem.querySelector('.my-ext-record-button') &&
            (target.classList.contains('my-ext-edit-button') || selectModified !== false)) {
            let menuButon = menuItem.querySelector('.my-ext-content-button');
            let searchText = menuButon.textContent;
            let allItems = Array.from(menuList.querySelectorAll('.my-ext-menu-item'));
            allItems.forEach(item => {
                if (item !== menuItem) {
                    item.classList.add('disabled-element');
                }
            })

            let criteriaSet = menuItem.querySelector('select[name="CriteriaSet"]');
            let dateRange = menuItem.querySelector('select[name="DateFilter.DateRange"]');
            let ddlSort = menuItem.querySelector('select[name="Sort"]');
            let criteriaExp = menuItem.querySelectorAll('input[type="hidden"][name^="CriteriaExp["]');
            let criteriaExpHtml = '';
            if (criteriaExp !== "" && criteriaExp.length > 0) {
                criteriaExp.forEach(exp => {
                    criteriaExpHtml += exp.outerHTML;
                });
            }
            menuItem.replaceWith(renderMenuItem(searchText, criteriaSet.outerHTML, dateRange.outerHTML,
                ddlSort.outerHTML, criteriaExpHtml.outerHTML, true));
            isEdited = true;
            selectModified = false;
        }

        if (target.classList.contains('my-ext-record-button')) {
            let menuButon = menuItem.querySelector('.my-ext-content-button');
            let searchText = menuButon.value;
            let criteriaSet = menuItem.querySelector('select[name="CriteriaSet"]');
            let dateRange = menuItem.querySelector('select[name="DateFilter.DateRange"]');
            let ddlSort = menuItem.querySelector('select[name="Sort"]');
            let criteriaExp = menuItem.querySelectorAll('input[type="hidden"][name^="CriteriaExp["]');
            let criteriaExpHtml = '';
            if (criteriaExp !== "" && criteriaExp.length > 0) {
                criteriaExp.forEach(exp => {
                    criteriaExpHtml += exp.outerHTML;
                });
            }
            menuItem.replaceWith(renderMenuItem(searchText, criteriaSet.outerHTML, dateRange.outerHTML, ddlSort.outerHTML,
                criteriaExpHtml.outerHTML, false));

            const allItems = Array.from(menuList.querySelectorAll('.my-ext-menu-item'));
            allItems.forEach(item => {
                if (item !== menuItem) {
                    item.classList.remove('disabled-element');
                }
            })
            chrome.storage.local.get(['menuItems'], function (result) {
                const menuItems = result.menuItems || [];
                const index = allItems.indexOf(menuItem);
                if (index !== -1) {
                    menuItems[index].text = searchText;
                    menuItems[index].criteriaSet = criteriaSet.outerHTML;
                    menuItems[index].dateRange = dateRange.outerHTML;
                    menuItems[index].sort = ddlSort.outerHTML;
                    menuItems[index].criteriaExp = criteriaExpHtml;
                    saveMenuItems(menuItems);
                }
            });
            selectModified = false;
            isEdited = true;
        }

        if (target.classList.contains('my-ext-delete-button')) {
            chrome.storage.local.get(['menuItems'], function (result) {
                const menuItems = result.menuItems || [];
                const allItems = Array.from(menuList.querySelectorAll('.my-ext-menu-item'));
                const index = allItems.indexOf(menuItem);
                if (index !== -1) {
                    menuItems.splice(index, 1);
                    saveMenuItems(menuItems);
                }
            });
        }

        if (target.classList.contains('my-ext-move-up-button')) {
            const allItems = Array.from(menuList.querySelectorAll('.my-ext-menu-item'));
            const index = allItems.indexOf(menuItem);
            if (index > 0) {
                // Échanger avec l'élément précédent
                const prevItem = allItems[index - 1];
                menuList.insertBefore(menuItem, prevItem);

                // Mettre à jour le stockage
                chrome.storage.local.get(['menuItems'], function (result) {
                    const menuItems = result.menuItems || [];
                    // Échanger les éléments dans le tableau
                    [menuItems[index], menuItems[index - 1]] = [menuItems[index - 1], menuItems[index]];
                    saveMenuItems(menuItems);
                });
            }
        }

        if (target.classList.contains('my-ext-move-down-button')) {
            const allItems = Array.from(menuList.querySelectorAll('.my-ext-menu-item'));
            const index = allItems.indexOf(menuItem);
            if (index < allItems.length - 1) {
                // Échanger avec l'élément suivant
                const nextItem = allItems[index + 1];
                menuList.insertBefore(nextItem, menuItem);

                // Mettre à jour le stockage
                chrome.storage.local.get(['menuItems'], function (result) {
                    const menuItems = result.menuItems || [];
                    // Échanger les éléments dans le tableau
                    [menuItems[index], menuItems[index + 1]] = [menuItems[index + 1], menuItems[index]];
                    saveMenuItems(menuItems);
                });
            }
        }
    });

    // S'il n'y a pas de recherche à sauvegarder, on déactive le bouton
    if (!path.startsWith("/Search/Result")) {
        menuContainer.querySelector('.my-ext-add-button').classList.add("disabled-element");
    }
}

function renderMenuItem(text, criteriaSet, dateRange,ddlSort, criteriaExp, isInEditedMode = false) {
    let searchValue;
    let editButton;
    let upButton = `<button class="my-ext-move-up-button" title="Monter">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/>
        </svg>
      </button>`;
    let downButton = `<button class="my-ext-move-down-button" title="Descendre">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      </button>`;
    if (criteriaExp === undefined) criteriaExp = "";
    if (isInEditedMode) {
        searchValue = `<input type="text" class="my-ext-content-button" value="${text}" />`;
        editButton = `<button class="my-ext-record-button" title="Valider les modifications">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.477-4.425a.235.235 0 0 1 .02-.022z"/>
        </svg></button>`;
        upButton = upButton.replace('my-ext-move-up-button', 'my-ext-move-up-button disabled-element');
        downButton = downButton.replace('my-ext-move-down-button', 'my-ext-move-down-button disabled-element');
    } else {
        searchValue = `<button class="my-ext-content-button">${text}</button>`;
        editButton = `<button class="my-ext-edit-button" title="Éditer">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
          <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
        </svg>
      </button>`;
    }
    const menuItem = document.createElement('li');
    menuItem.className = 'my-ext-menu-item';
    menuItem.innerHTML = `
        <table class="my-ext-item-table"><tr><td rowspan="2">
        ${searchValue}
        ${criteriaSet}${dateRange}${ddlSort}${criteriaExp}
        </td>
        <td class="my-ext-small-td">${editButton}</td>
      <td class="my-ext-small-td">${upButton}</td></tr>
      <td class="my-ext-small-td"><button class="my-ext-delete-button" title="Supprimer">
        <svg  xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
        </svg>
      </button></td>      
      <td class="my-ext-small-td">${downButton}
      </td></tr></table>
      `;
    return menuItem;
}

getSettings().then((retrievedSettings) => {
    settings = retrievedSettings;
    // Appeler la fonction pour créer le menu lorsque le DOM est chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createMenu);
    } else {
    createMenu();
    }
});




