const useStockFirmwareCheckbox = document.getElementById('useStockFirmware');
const customFileInputDiv = document.getElementById('customFileInputDiv');
const customFileInput = document.getElementById('customFileInput');
const customFileLabel = document.getElementById('customFileLabel');
const stockFirmwareSelect = document.getElementById('stockFirmwareSelect');
const useStockFirmwareDiv = document.getElementById('useStockFirmwareDiv');
const flashButton = document.getElementById('flashButton');
const patchButton = document.getElementById('patchButton');
const downloadButton = document.getElementById('downloadButton');
const patchVersionSelect = document.getElementById('patchVersionSelect');

// Click event listener for the div
useStockFirmwareDiv.addEventListener('click', function (event) {
    useStockFirmwareCheckbox.checked = !useStockFirmwareCheckbox.checked;
    flashButton.classList.add('disabled');
    firmware.clear();

    if (useStockFirmwareCheckbox.checked) {
        customFileInputDiv.classList.add('d-none');
        stockFirmwareSelect.classList.remove('d-none');
        loadFirmware();
    } else {
        customFileInputDiv.classList.remove('d-none');
        stockFirmwareSelect.classList.add('d-none');
        if (customFileInput.files.length > 0) loadFirmware();
    }
});

stockFirmwareSelect.addEventListener('change', function () {
    patchButton.classList.remove('disabled');
    loadFirmware();
});

// Update text to show filename after file selection
customFileInput.addEventListener('change', function () {
    if (this.files.length > 0) {
        customFileLabel.textContent = Array.from(this.files).map(file => file.name).join(', ');
        loadFirmware();
        return;
    }
    customFileLabel.textContent = i18next.t("button-firmware-browse-file");

});

function disableIncompatibleMods(disableAll = false) {
    // Disable mods that are incompatible with the loaded firmware
    for (const modInstance of modInstances) {
        if (modInstance.versionCheck(firmware.versionString) === true && !disableAll)
            modInstance.modOuterDiv.removeAttribute('style');
        else {
            const modCheckbox = modInstance.modOuterDiv.querySelector('input[type="checkbox"]');
            modCheckbox.checked = false;
            modCheckbox.dispatchEvent(new Event('change'));
            modInstance.modOuterDiv.style.opacity = 0.5;
            modInstance.modOuterDiv.style.pointerEvents = 'none';
        }
    }
}

// function to parse a symbol file
function parseSymFile(symFile) {
    if (symFile[0] === '{') {
        return JSON.parse(symFile);
    }
    const sym = {};
    const lines = symFile.split('\n');
    for (const line of lines) {
        if (line.length === 0) continue;
        const parts = line.split(' ');
        const address = parseInt(parts[0], 16);
        if (address >= 0x20000000) continue; // ignore addresses in ram
        const name = parts[2];
        sym[name] = address;
    }
    return sym;
}

// ugly and bad code to load the firmware and symbols
async function loadFirmware() {
    patchButton.classList.add('disabled');
    downloadButton.classList.add('disabled');
    flashButton.classList.add('disabled');
    firmware.clear();

    try {
        if (useStockFirmwareCheckbox.checked) {
            const response = await fetch(stockFirmwareSelect.value);

            if (!response.ok) {
                throw new Error('Failed to fetch firmware file.');
            }

            const arrayBuffer = await response.arrayBuffer();
            firmware.unpack(new Uint8Array(arrayBuffer));
            log(i18next.t("log.loaded-firmware-version", { version: firmware.versionString }));
            disableIncompatibleMods();

            const symResponse = await fetch(stockFirmwareSelect.value.replace('.bin', '.json'));

            if (!symResponse.ok) {
                throw new Error('Failed to fetch symbol file.');
            }

            const symFile = await symResponse.text();
            firmware.symbolTable = parseSymFile(symFile);
            log(i18next.t("log.loaded-symbol-file", { count: Object.keys(firmware.symbolTable).length }));
            console.log('Loaded symbol file.', firmware.symbolTable);
            patchButton.classList.remove('disabled');
        } else {
            let firmwareFile = null, symbolFile = null;
            for (const file of customFileInput.files) {
                if (file.name.endsWith('.bin')) {
                    firmwareFile = file;
                }
                if (file.name.endsWith('.txt' || file.name.endsWith('.json'))) {
                    symbolFile = file;
                }
            }

            if (firmwareFile === null) {
                log(i18next.t("log.loaded-firmware-file-hint"));
                throw new Error('No firmware file found.');
            } else {
                const arrayBuffer = await readFileAsArrayBuffer(firmwareFile);
                firmware.unpack(new Uint8Array(arrayBuffer));
                log(i18next.t("log.loaded-firmware-version", { version: firmware.versionString }));
                disableIncompatibleMods();

                if (symbolFile === null) {
                    log(i18next.t("log.loaded-symbol-none"));
                    disableIncompatibleMods(true);
                } else {
                    const symFile = await readFileAsText(symbolFile);
                    firmware.symbolTable = parseSymFile(symFile);
                    log(i18next.t("log.loaded-symbol-file", { count: Object.keys(firmware.symbolTable).length }));
                    console.log('Loaded symbol file.', firmware.symbolTable);
                }

                patchButton.classList.remove('disabled');
            }
        }

        return;
    } catch (error) {
        console.error(error);
        log(i18next.t("log.loaded-firmware-error"));
        firmware.clear();
        return;
    }
}

// Helper functions for reading files
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        reader.onerror = (event) => {
            reject(event.error);
        };
        reader.readAsArrayBuffer(file);
    });
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        reader.onerror = (event) => {
            reject(event.error);
        };
        reader.readAsText(file);
    });
}



patchButton.addEventListener('click', function () {
    // Apply mods
    firmware.rawFirmware = firmware.rawFirmwareBackup; // reset firmware
    applyFirmwareMods(firmware);

    // Check size
    const current_size = firmware.rawFirmware.length;
    const max_size = 0xEFFF;
    const percentage = (current_size / max_size) * 100;
    log(i18next.t("log.patched-firmware-size", { percentage: percentage.toFixed(2), current_size: current_size, max_size: max_size }));
    if (current_size > max_size) {
        log(i18next.t("log.patched-firmware-size-warning"));
        downloadButton.classList.add('disabled');
        flashButton.classList.add('disabled');
        firmware.clear();
        return;
    }

    // Adjust firmware version to allow cross flashing
    const newVersionChar = patchVersionSelect.value;
    const newVersionCharCode = newVersionChar.charCodeAt(0);
    firmware.rawVersion[0] = newVersionCharCode;
    log(i18next.t("log.patched-firmware-version", { version: new TextDecoder().decode(firmware.rawVersion.subarray(0, firmware.rawVersion.indexOf(0))) }));

    const packed_firmware = firmware.pack();

    // Save encoded firmware to file
    const fwPackedBlob = new Blob([packed_firmware]);
    const fwPackedURL = URL.createObjectURL(fwPackedBlob);
    downloadButton.href = fwPackedURL;
    downloadButton.download = 'fw_modded.bin';
    downloadButton.classList.remove('disabled');
    flashButton.classList.remove('disabled');
});

// flasher

async function flash_init(port) {
    const decoder = new TextDecoder();
    // example version data: { 0x30, 0x5, 0x10, 0x0, '2', '.', '0', '1', '.', '2', '3', 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0} for version 2.01.23
    // version from the fw file is stored in the 16 byte uint8array rawVersion starting with the version string at index 0, padded with 0x00
    // seems like the version string is just sent after a 4 byte header, so we can just send the rawVersion array

    const data = new Uint8Array([0x30, 0x5, rawVersion.length, 0x0, ...rawVersion]);
    // const data = new Uint8Array([0x30, 0x5, 0x10, 0x0, 0x32, 0x2e, 0x30, 0x31, 0x2e, 0x32, 0x33, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0]); //send v2 just like in k5prog
    console.log('Sending version request: ', data);

    await sendPacket(port, data);

    const response = await readPacket(port, 0x18);
    console.log('Version Response: ', response);
    if (response[0] == 0x18) {
        return response;
    }
    return Promise.reject('Maximum attempts reached, no response was 0x18. Aborting.');
}

// function to check if the version of the firmware is compatible with the bootloader (it does not actually matter lol)
function flash_checkVersion(dataPacket, versionFromFirmware) {
    const decoder = new TextDecoder();
    // print bootloader version as string, located at index 0x14
    log(i18next.t("log.bootloader-version", { version: decoder.decode(dataPacket.slice(0x14, 0x14 + 7)) }));

    // the radio accepts a * wildcard version, so we will do the same
    if (versionFromFirmware[0] == 0x2a) return true;

    // dataPacket is a uint8array containing the relevant byte at index 0x14
    // this byte is a 2 for the uv-k5, 3 for the k5(8)/k6, 4 for the uv-5r plus
    // versionFromFirmware is a uint8array containing the version at index 0, padded with 0x00
    return dataPacket[0x14] == versionFromFirmware[0];
}

// function to create a flash command from a block of data (max 0x100 bytes), the address and the total size of the firmware file
function flash_generateCommand(data, address, totalSize) {
    // the flash command structure is as follows:
    /* 0x19  0x5  0xc  0x1  0x8a  0x8d  0x9f  0x1d  
     * address_msb  address_lsb  address_final_msb  address_final_lsb  length_msb  length_lsb  0x0  0x0 
     * [0x100 bytes of data, if length is <0x100 then fill the rest with zeroes] */

    // flash is written in 0x100 blocks, if data is less than 0x100 bytes then it is padded with zeroes
    if (data.length < 0x100) {
        const padding = new Uint8Array(0x100 - data.length);
        data = new Uint8Array([...data, ...padding]);
    }
    if (data.length != 0x100) throw new Error('Tell matt that he is an idiot');

    // the address is a 16 bit integer, so we need to split it into two bytes
    const address_msb = (address & 0xff00) >> 8;
    const address_lsb = address & 0xff;

    const address_final = (totalSize + 0xff) & ~0xff; // add 0xff to totalSize and then round down to the next multiple of 0x100 by stripping the last byte
    if (address_final > 0xf000) throw new Error('Total size is too large');
    const address_final_msb = (address_final & 0xff00) >> 8;
    const address_final_lsb = 0x0; // since address_final can only be a multiple of 0x100, address_final_lsb is always 0x0

    // the length is fixed to 0x100 bytes
    const length_msb = 0x01;
    const length_lsb = 0x00;

    return new Uint8Array([0x19, 0x5, 0xc, 0x1, 0x8a, 0x8d, 0x9f, 0x1d, address_msb, address_lsb, address_final_msb, address_final_lsb, length_msb, length_lsb, 0x0, 0x0, ...data]);
}

// function to flash the firmware file to the radio
async function flash_flashFirmware(port, firmware) {
    // for loop to flash the firmware in 0x100 byte blocks
    // this loop is safe as long as the firmware file is smaller than 0xf000 bytes
    if (firmware.length > 0xefff) throw new Error('Last resort boundary check failed. Whoever touched the code is an idiot.');
    log(i18next.t("log.flashing-percentage", { percentage: 0 }));

    for (let i = 0; i < firmware.length; i += 0x100) {
        const data = firmware.slice(i, i + 0x100);
        const command = flash_generateCommand(data, i, firmware.length);

        try {
            await sendPacket(port, command);
            await readPacket(port, 0x1a);
        } catch (e) {
            log(i18next.t("log.flashing-rejected"));
            return Promise.reject(e);
        }
        log(i18next.t("log.flashing-percentage", { percentage: ((i / firmware.length) * 100).toFixed(1) }), true);
    }
    log(i18next.t("log.flashing-percentage", { percentage: 100 }), true);
    log(i18next.t("log.flashing-success"));
    return Promise.resolve();
}

flashButton.addEventListener('click', async function () {
    flashButton.classList.add('disabled');
    if (firmware.rawFirmware.length > 0xefff) {
        log(i18next.t("log.flashing-oversize"));
        flashButton.classList.remove('disabled');
        return;
    }
    log(i18next.t("log.flashing-connecting"));
    const port = await connect();
    if (!port) {
        log(i18next.t("log.flashing-connecting-failed"));
        flashButton.classList.remove('disabled');
        return;
    }

    try {
        const data = await readPacket(port, 0x18, 1000);
        if (data[0] == 0x18) {
            console.log('Received 0x18 packet. Radio is ready for flashing.');
            console.log('0x18 packet data: ', data);
            log(i18next.t("log.flashing-radio-detected"));

            const response = await flash_init(port);
            if (flash_checkVersion(response, firmware.rawVersion)) {
                log(i18next.t("log.flashing-version-check-passed"));
            } else {
                log(i18next.t("log.flashing-version-check-failed"));
                return;
            }
            log(i18next.t("log.flashing-starting"));
            await flash_flashFirmware(port, firmware.rawFirmware);

            return;
        } else {
            console.log('Received unexpected packet. Radio is not ready for flashing.');
            log(i18next.t("log.flashing-unexpected-packet"));
            console.log('Data: ', data);
            return;
        }
    } catch (error) {
        if (error !== 'Reader has been cancelled.') {
            console.error('Error:', error);
            log(i18next.t("log.flashing-unusual-error"));
        } else {
            log(i18next.t("log.flashing-radio-not-detected"));
        }
        return;

    } finally {
        port.close();
        flashButton.classList.remove('disabled');
    }
});

function init() {
    modLoader(); // loads and shows all mods from mods.js
    loadFirmware(); // loads the firmware file and disables incompatible mods
}