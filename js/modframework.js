function addModToUI(mod, modDiv) {
  // Create a card div
  const card = document.createElement("div");
  card.classList.add("card", "mb-3", "border-left-primary", "border-left-secondary");
  card.style.transition = "background-color 0.5s ease";
  if (mod.hidden) {
    card.classList.add("hiddenMod", "d-none", "border-danger", "border-left-danger");
  }

  // Create a card body div
  const cardBody = document.createElement("div");
  cardBody.classList.add("card-body");

  // Create a row div
  const row = document.createElement("div");
  row.classList.add("row");

  // Create checkbox column
  const checkboxCol = document.createElement("div");
  checkboxCol.classList.add("col-auto");

  if (mod.enabled != null) {
    // Create checkbox for enabling the mod
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.height = "1.45rem";
    checkbox.style.width = "1.45rem";
    checkbox.checked = mod.enabled;
    checkbox.addEventListener("change", function () {
      mod.enabled = checkbox.checked;
      if (checkbox.checked) {
        $(mod.modSpecificDiv).collapse("show");
        card.classList.remove("border-left-secondary");
        card.style.backgroundColor = "#4e73df0d";
      } else {
        $(mod.modSpecificDiv).collapse("hide");
        card.classList.add("border-left-secondary");
        card.style.backgroundColor = "";
      }
    });
    checkboxCol.appendChild(checkbox);
    row.appendChild(checkboxCol);
    mod.modSpecificDiv.classList.add("collapse");
  }

  // Create name column
  const nameCol = document.createElement("div");
  nameCol.classList.add("col-auto", "mr-auto", "pl-1");
  if (mod.hidden) {
    nameCol.classList.add("text-danger");
  }

  const nameText = document.createElement("h5");
  nameText.textContent = mod.name;
  nameCol.appendChild(nameText);

  row.appendChild(nameCol);

  // Create size column if this mod.size is set
  if (mod.size != null) {
    const sizeCol = document.createElement("div");
    sizeCol.classList.add("col-auto");
    const sizeText = document.createElement("p");
    sizeText.textContent = t("mod.common.flash-usage", { size: mod.size });
    sizeCol.appendChild(sizeText);
    row.appendChild(sizeCol);
  }

  const descriptionBox = document.createElement("div");

  const descriptionText = document.createElement("p");
  descriptionText.textContent = mod.description;
  descriptionBox.appendChild(descriptionText);

  // Add the mod-specific div for custom inputs
  cardBody.appendChild(row);
  cardBody.appendChild(descriptionBox);
  cardBody.appendChild(mod.modSpecificDiv);


  // Add card body to the card div
  card.appendChild(cardBody);

  // Add the card to the modDiv
  modDiv.appendChild(card);
}


function showHiddenMods() {
  const hiddenMods = document.getElementsByClassName("hiddenMod");
  for (const mod of hiddenMods) {
    mod.classList.remove("d-none");
  }
  log(t("mod.common.hidden-mods-shown"));
}

var modInstances;

function modLoader() {
  document.getElementById("modsContainer").innerHTML = ""; // Clear the mods container
  modInstances = [];
  modClasses.forEach(ModClass => {
    const modInstance = new ModClass();
    modInstances.push(modInstance); // Add the instance to the array
    const modDiv = document.createElement("div");
    addModToUI(modInstance, modDiv);
    document.getElementById("modsContainer").appendChild(modDiv);
    modInstance.modOuterDiv = modDiv;
  });

  // for development purposes, add ?hidden to the url to always show hidden mods
  if (window.location.href.indexOf("?hidden") > -1) {
    showHiddenMods();
  }

  return modInstances; // Return the array of mod instances
}


function applyFirmwareMods(fw) {
  for (const modInstance of modInstances) {
    if (modInstance.enabled) {
      try {
        modInstance.apply(fw, fw.symbolTable);
        log(t("mod.common.mod-success", { name: modInstance.name }));
      } catch (error) {
        log(t("mod.common.mod-error", { name: modInstance.name, error: error.message }));
        console.log(error);
      }
    }
  }
  log(t("mod.common.mods-applied"));
}

function log(message, replace = false) {
  const consoleArea = document.getElementById('console');

  if (replace) {
    // Replace the last line with the new message
    const lastLineIndex = consoleArea.value.lastIndexOf('\n');
    consoleArea.value = consoleArea.value.substring(0, lastLineIndex) + '\n' + message;
  } else {
    // Append the new message to the existing content and add a newline

    // If the console is empty, dont add a newline
    if (consoleArea.value.length === 0) {
      consoleArea.value = message;
    } else {

      consoleArea.value += '\n' + message;
    }
  }

  // Scroll to the bottom to show the latest message
  consoleArea.scrollTop = consoleArea.scrollHeight;
}



// Helper functions:

/**
 * Converts a hexadecimal string to a Uint8Array.
 * The input hex string should have the format "HH" where HH is a two-digit hexadecimal value. 
 * 
 * 0x or \x is not allowed
 * 
 * To output a python bytearray in the correct format, use this in python: print(''.join('%02x'%i for i in YOUR_BYTEARRAY))
 * @example hexString("0102AAFF") // Outputs Uint8Array of 1, 2, 170, 255
 * @param {string} hexString - The hexadecimal string to convert.
 * @returns {Uint8Array} The Uint8Array representing the converted data.
 */
function hexString(hexString) {
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
    const byteValue = parseInt(hexString.substr(i * 2, 2), 16);
    byteArray[i] = byteValue;
  }
  return byteArray;
}
const hex = hexString; // Alias for hexString

/**
 * Converts a Uint8Array to a hexadecimal string, mostly for debugging purposes.
 *
 * @param {Uint8Array} uint8Array - The Uint8Array to convert.
 * @returns {string} The hexadecimal representation of the Uint8Array without separators. 
 */
function uint8ArrayToHexString(uint8Array) {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Replaces or appends a section in the firmware data with new data at the specified offset.
 * To append data to the firmware, use firmwareData.length as the offset. 
 * @param {Uint8Array} firmwareData - The original firmware Uint8array.
 * @param {Uint8Array} newData - The new data to replace the section with.
 * @param {number} offset - The offset where the section should be replaced. 
 */
function replaceSection(firmwareData, newData, offset) {
  const lengthDifference = newData.length - (firmwareData.length - offset);

  if (lengthDifference > 0) {
    firmwareData = new Uint8Array(firmwareData.length + lengthDifference);
    firmwareData.set(firmwareData.subarray(0, offset));
    firmwareData.set(newData, offset);
  } else {
    firmwareData.set(newData, offset);
    firmwareData = firmwareData.subarray(0, firmwareData.length + lengthDifference);
  }
}

/**
 * Compares two Uint8Arrays to check if they are equal.
 * @param {Uint8Array} array1 - The first Uint8Array to compare.
 * @param {Uint8Array} array2 - The second Uint8Array to compare.
 * @returns {boolean} - True if the Uint8Arrays are equal, false otherwise.
 */
function compareUint8Arrays(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Compares a section of a Uint8Array with another Uint8Array.
 * @param {Uint8Array} array - The Uint8Array to compare a section from.
 * @param {Uint8Array} section - The Uint8Array representing the section to compare.
 * @param {number} offset - The offset within the main array to start the comparison.
 * @returns {boolean} - True if the section matches the part of the main array starting from the offset, false otherwise.
 */
function compareSection(array, section, offset) {
  if (offset < 0 || offset + section.length > array.length) {
    throw new Error("Offset is out of bounds.");
  }

  const slicedArray = array.slice(offset, offset + section.length);
  return compareUint8Arrays(slicedArray, section);
}

/**
 * Adds an input field to a parent div with a label and default text.
 *
 * @param {HTMLElement} parentDiv - The parent div to which the input field will be added. Usually this.modSpecificDiv
 * @param {string|[string, string]} labelText - Plain string for left label or array with label text (title) for the left and right label.
 * @param {string} defaultText - The default text to pre-fill the input field with.
 * @returns {HTMLInputElement} - The created input element, assign it to a constant for later use. 
 */
function addInputField(parentDiv, labelText, defaultValue) {
  const inputGroup = document.createElement("div");
  inputGroup.classList.add("input-group", "mb-1");

  if (!Array.isArray(labelText)) {
    labelText = [labelText, null];
  }

  if (labelText[0] != null) {
    const inputGroupPre = document.createElement("div");
    inputGroupPre.classList.add("input-group-prepend");

    const labell = document.createElement("span");
    labell.classList.add("input-group-text");
    labell.innerText = labelText[0];
    inputGroupPre.appendChild(labell);
    inputGroup.appendChild(inputGroupPre);
  }

  const input = document.createElement("input");
  input.classList.add("form-control");
  input.type = "text";
  input.value = defaultValue; // Set the default value
  inputGroup.appendChild(input);

  if (labelText[1] != null) {
    const inputGroupApp = document.createElement("div");
    inputGroupApp.classList.add("input-group-append");

    const labelr = document.createElement("span");
    labelr.classList.add("input-group-text");
    labelr.innerText = labelText[1];
    inputGroupApp.appendChild(labelr);
    inputGroup.appendChild(inputGroupApp);
  }

  parentDiv.appendChild(inputGroup);

  return input; // Return the input element
}

/**
 * Adds a radio input field to a parent div with an id, name, value and label.
 *
 * @param {HTMLElement} parentDiv - The parent div to which the input field will be added. Usually this.modSpecificDiv
 * @param {string} labelText - The label text (title) for the input field.
 * @param {string} id - The id is needed to link radio button and label, choose any unique id. 
 * @param {string} name - The name of the radio button needs to be the same for all radio buttons in a mutually exclusive group. 
 * @returns {HTMLInputElement} - The created input element, assign it to a constant for later use. 
 */
function addRadioButton(parentDiv, labelText, id, name) {
  const formCheckDiv = document.createElement("div");
  formCheckDiv.classList.add("form-check", "mb-1");

  const inputElement = document.createElement("input");
  inputElement.classList.add("form-check-input");
  inputElement.type = "radio";
  inputElement.name = name;
  inputElement.id = id;

  const labelElement = document.createElement("label");
  labelElement.classList.add("form-check-label");
  labelElement.htmlFor = id;
  labelElement.textContent = labelText;

  formCheckDiv.appendChild(inputElement);
  formCheckDiv.appendChild(labelElement);

  parentDiv.appendChild(formCheckDiv);

  return inputElement;
}
