// do not mess with this file, wrong values in calib data can physically damage your radio

class ConfigMod {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.size = null;
        this.enabled = false; // Checkbox status, initially disabled
        this.hidden = false; // If true, the mod will be hidden until activated in the instructions panel. Use this for risky mods. 
        this.modSpecificDiv = document.createElement("div"); // Div for mod-specific inputs

        this.config = this.readConfigData(); // Type [{ configData: data1, offset: offset1 }, { configData: data2, offset: offset2 }, ...]. Stores the entire configuration data for this mod, will be modified and returned in writeConfigData(). 

        // If needed, create input fields here and append them to the modSpecificDiv
    }

    readConfigData() {
        // This method should be overridden in each mod implementation
        // It should read the config data from rawEEPROM and store it in this.configData
        // It should return the config data blocks as an array of objects, each containing the config data and offset
        // The properties of the object can be named 
        return [{ configData: data1, offset: offset1 }, { configData: data2, offset: offset2 }];
    }

    writeConfigData() {
        // This method should be overridden in each mod implementation
        // It should generate the config as a raw Uint8Array and offset
        // Since EEPROM is somewhat fragmented, the return type is an array of objects so multiple blocks of data can be written
        // A later function will strip unchanged data and write the config to serial
        return this.config;
    }
}

const modClasses = [
    class Mod_v26BugCheck extends ConfigMod {
        // do not try to use this to modify output power, it only leads to more harmonics and a dead/damaged radio. increase supply voltage instead, it will actually give you more power but also damage your radio. you have been warned.
        constructor() {
            super("v26 Bug Check", "Automatically checks if your radio is affected by the v26 TX Power bug.", null);
            this.enabled = null; // null removes the checkbox

            this.addAlert(this.isAffected());
        }

        isAffected() {
            const affectedBands = [];
            // read calibration data block
            const calibData = this.config[0];

            // format is 9 bytes per channel + 7 bytes padding, 7 channels
            for (let i = 0; i < 7 * 0x10; i += 0x10) {
                // read 3 blocks of 3 bytes
                for (let j = 0; j < 9; j += 3) {
                    // each block contains calibration values for 3 frequency ranges, low, mid and high
                    const low = calibData.configData[i + j];
                    const mid = calibData.configData[i + j + 1];
                    const high = calibData.configData[i + j + 2];

                    // the bug is triggered if mid - low < 0 or high - mid < 0
                    if (mid - low < 0 || high - mid < 0) {
                        let powerLevel;
                        switch (j) {
                            case 0:
                                powerLevel = "L";
                                break;
                            case 3:
                                powerLevel = "M";
                                break;
                            case 6:
                                powerLevel = "H";
                                break;
                        }
                        affectedBands.push({ band: i / 0x10 + 1, powerLevel: powerLevel });
                    }
                }
            }

            return affectedBands;
        }

        addAlert(affectedBands) {
            const isAffected = affectedBands.length > 0;
            const alert = document.createElement("div");
            alert.classList.add("alert", "mb-0", isAffected ? "alert-danger" : "alert-success");
            // add alert heading
            const heading = document.createElement("h4");
            heading.classList.add("alert-heading");
            heading.textContent = isAffected ? "Your radio is affected by the v26 TX Power bug." : "Your radio is not affected by the v26 TX Power bug.";
            alert.appendChild(heading);
            // add alert text
            const text = document.createElement("p");
            text.classList.add("mb-0");
            text.textContent = isAffected ? "Power levels can be lower than expected on v26 firmware (check log to the right for details). Use newer firmware to have correct power on all frequencies." : "Power on all frequencies is correct, regardless of firmware version.";
            alert.appendChild(text);
            if (isAffected) {
                // add hr and p
                alert.appendChild(document.createElement("hr"));
                const affectedList = document.createElement("p");
                affectedList.classList.add("mb-0");
                affectedList.textContent = "Affected bands:";
                alert.appendChild(affectedList);
                // add list
                const list = document.createElement("ul");
                affectedBands.forEach(band => {
                    const item = document.createElement("li");
                    item.textContent = `Band ${band.band} at power level ${band.powerLevel}`;
                    list.appendChild(item);
                });
                alert.appendChild(list);
            }

            this.modSpecificDiv.appendChild(alert);
        }

        readConfigData() {
            const offset1 = 0x1ed0;
            const length1 = 7 * 0x10;

            // load data from rawEEPROM
            const data1 = rawEEPROM.slice(offset1, offset1 + length1);

            return [{ configData: data1, offset: offset1 }];
        }

        writeConfigData() {
            return null;
        }
    }
    ,
]