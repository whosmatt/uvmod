class FirmwareMod {
    constructor(name, description, size) {
        this.name = name;
        this.description = description;
        this.size = size; // Additional flash usage in bytes, set to null to hide the size indicator
        this.hidden = false; // If true, the mod will be hidden until activated in the instructions panel. Use this for risky mods. 

        this.enabled = false; // Checkbox status, initially disabled
        this.modSpecificDiv = document.createElement("div"); // Div for mod-specific inputs
        
        // If needed, create input fields here and append them to the modSpecificDiv
        // Code here runs once when the mod is loaded
    }

    versionCheck(firmwareVersion) {
        // If needed, you can use this function to exclude certain firmware versions or even limit the mod to a specific version
        // The mod will be grayed out and disabled if this function returns false
        return true; // Return true if the mod is compatible with the firmware version
    }

    apply(firmwareObject, symbolsObject) {
        // This method should be overridden in each mod implementation
        // It should apply the mod on fw and return it
        // The offsets can be found in the sym object
        // Only use offsets from sym, do not hardcode them

        // These functions are available:
        // hex(string) - convert a hex string (no delimiters) to a uint8array
        // firmwareObject.r(offset, newData) - replace uint8array at offset with newData
        // firmwareObject.c(offset, oldData) - check if uint8array at offset matches oldData, returns true or false
        // firmwareObject.dump(offset, length) - returns a hex string of the data at offset with the specified length
        // firmwareObject.rawFirmware - the firmware as a uint8array if needed
    }
}

const modClasses = [
    class Mod_BatteryIcon extends FirmwareMod {
        constructor() {
            super(t("mod.BatteryIcon.name"), t("mod.BatteryIcon.description"), 0);
        }

        apply(fw, sym) {
            if (fw.c(sym.BITMAP_BatteryLevel1, hex("003e227f4141414141414141414141414163"))) 
            {
                fw.r(sym.BITMAP_BatteryLevel1, hex("003e2263414141414141414141414141417f"));
                fw.r(sym.BITMAP_BatteryLevel2, hex("003e2263414141414141414141415d5d4163"));
                fw.r(sym.BITMAP_BatteryLevel3, hex("003e2263414141414141415d5d415d5d417f"));
                fw.r(sym.BITMAP_BatteryLevel4, hex("003e2263414141415d5d415d5d415d5d417f"));
                fw.r(sym.BITMAP_BatteryLevel5, hex("003e2263415d5d415d5d415d5d415d5d417f"));
            }
            else {
                throw new Error(t("mod.common.error-unexpected-data"));
            }
        }
    }
    ,
];
