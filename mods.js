modClasses = [
    class Mod_Example extends FirmwareMod {
        constructor() {
            super("Example Mod", "This mod does absolutely nothing and is used as an example for implementing new mods. It is hidden for convenience, not because it does anything risky.", 0); // Add name, description and size (additional flash used, 0 for most mods)
            this.hidden = true; // Set this to true for high-risk mods such as the "Enable TX everywhere" mod
            // Customize the mod-specific div with input elements
            // There is a helper function for adding input fields easily:
            this.inputField1 = addInputField(this.modSpecificDiv, "Example Mod specific input field 1", "Editable data");
        }

        apply(firmwareData) {
            log("The value of input field 1 is: " + this.inputField1.value);
            // Implement the logic to apply the specific mod here
            // You can use the mod-specific inputs in this.modSpecificDiv
            return firmwareData;
        }
    }
    ,
    class Mod_BatteryIcon extends FirmwareMod {
        constructor() {
            super("Battery icon", "Changes the battery icon to a more normal looking variant.", 0);
        }

        apply(firmwareData) {
            const offset = 0xD348 + 134;
            const oldData = hexString("3e227f4141414141414141414141414163003e227f415d5d4141414141414141414163003e227f415d5d415d5d4141414141414163003e227f415d5d415d5d415d5d4141414163003e227f415d5d415d5d415d5d415d5d4163");
            const newData = hexString("3e2263414141414141414141414141417f003e2263414141414141414141415d5d4163003e2263414141414141415d5d415d5d417f003e2263414141415d5d415d5d415d5d417f003e2263415d5d415d5d415d5d415d5d417f");
            if (compareSection(firmwareData, oldData, offset)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_ChangeContrast extends FirmwareMod {
        constructor() {
            super("LCD Contrast", "Changes LCD contrast to any value from 0 to 63 (higher is darker). The default value is 31", 0);

            this.contrastValue = addInputField(this.modSpecificDiv, "Enter a new contrast value from 0-63:", "31");
        }

        apply(firmwareData) {
            const minValue = 0;
            const maxValue = 63;
            const inputValue = parseInt(this.contrastValue.value);

            if (!isNaN(inputValue) && inputValue >= minValue && inputValue <= maxValue) {
                const newData = new Uint8Array([inputValue]);
                firmwareData = replaceSection(firmwareData, newData, 0xb7b0);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Contrast value must be a number from 0-63!`);
            }
            return firmwareData;
        }
    }
    ,
    class Mod_Font extends FirmwareMod {
        constructor() {
            super("Font", "Changes the font to one of the following custom fonts: ", 0);

            this.selectVCR = addRadioButton(this.modSpecificDiv, "VCR Font, replaces big digits", "selectVCR", "selectFont");
            this.selectFuturistic = addRadioButton(this.modSpecificDiv, "Futuristic Font (by DO7OO), replaces big and small digits", "selectFuturistic", "selectFont");
            this.selectVCR.checked = true;

        }

        apply(firmwareData) {
            if (this.selectVCR.checked) {
                const bigDigits = hexString("0000F8FC0686C6E6F676FCF80000001F3F7767636160703F1F0000000000181CFEFE00000000000000000060607F7F60600000000000181C8686868686C6FC780000007E7F6361616161616060000000181C0606868686C6FC7800000018387060616161733F1E00000080C0E070381CFEFE00000000000707060606067F7F06060000007E7E6666666666E6C68600000018387060606060703F1F000000F8FC8686868686861C180000001F3F7161616161733F1E000000060606060686C6E67E3E000000000000007F7F0100000000000078FCC686868686C6FC780000001E3F7361616161733F1E00000078FCC68686868686FCF800000018387161616161713F1F000000008080808080808080000000000001010101010101010000");
                firmwareData = replaceSection(firmwareData, bigDigits, 0xd502);
            }
            else if (this.selectFuturistic.checked) {
                const bigDigits = hexString("00FEFF01010101018181FFFF00007F7F40404040407F7F7F7F000000000000008080FFFF0000000000000000007F7F7F7F00000000018181818181818181FFFE00007F7F7F7F404040404040400000818181818181818181FFFE0000404040404040407F7F7F7F00007FFF80808080808080FFFF0000000000000000007F7F7F7F0000FEFF8181818181818181810000404040404040407F7F7F7F0000FEFF81818181818181818100007F7F7F7F40404040407F7F0000010101010101018181FFFE0000000000000000007F7F7F7F0000FEFF81818181818181FFFF00007F7F40404040407F7F7F7F0000FEFF81818181818181FFFF0000000000000000007F7F7F7F000000808080808080808080000000000303030303030303030000");
                const smallDigits = hexString("007E414141797F00000000787F000079794949494E0049494949797E0007080808787F004E4949497979007E79494949790001010101797E007E494949797F000E090909797F0008080808080000000000000000");
                firmwareData = replaceSection(firmwareData, bigDigits, 0xd502);
                firmwareData = replaceSection(firmwareData, smallDigits, 0xd620);
            }

            log(`Success: ${this.name} applied.`);
            return firmwareData;
        }
    }
    ,
    class Mod_FreqCopyTimeout extends FirmwareMod {
        constructor() {
            super("Disable Freq Copy Timeout", "Prevents freq copy and CTCSS decoder from timing out with \"SCAN FAIL\", allowing both functions to run indefinitely until a signal is found.", 0);
        }

        apply(firmwareData) {
            const offset = 0x4bbc;
            const oldData = hexString("521c");
            const newData = hexString("00bf");
            if (compareSection(firmwareData, oldData, offset)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_DisableTX extends FirmwareMod {
        constructor() {
            super("Disable TX completely", "Prevents transmitting on all frequencies, making the radio purely a receiver.", 0);
        }

        apply(firmwareData) {
            const offset = 0x180e;
            const oldData = hexString("cf2a");
            const newData = hexString("f0bd");
            if (compareSection(firmwareData, oldData, offset)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_EnableTXEverywhere extends FirmwareMod {
        constructor() {
            super("Enable TX everywhere", "DANGER! Allows transmitting on all frequencies. Only use this mod for testing, do not transmit on illegal frequencies!", 0);
            this.hidden = true;
        }

        apply(firmwareData) {
            const offset = 0x180e;
            const oldData = hexString("cf2a");
            const newData = hexString("5de0");
            if (compareSection(firmwareData, oldData, offset)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_EnableTXEverywhereButAirBand extends FirmwareMod {
        constructor() {
            super("Enable TX everywhere except Air Band", "DANGER! Allows transmitting on all frequencies except air band (118 - 137 MHz). Only use this mod for testing, do not transmit on illegal frequencies!", 0);
            this.hidden = true;
        }

        apply(firmwareData) {
            const offset = 0x1804;
            const newData = hexString("f0b5014649690968054a914205d3054a914202d20020c04301e00020ffe7f0bdc00db400a00bd100");
            firmwareData = replaceSection(firmwareData, newData, offset);
            log(`Success: ${this.name} applied.`);

            return firmwareData;
        }
    }
    ,
    class Mod_DoubleBacklightDuration extends FirmwareMod {
        constructor() {
            super("Double Backlight Duration", "Always multiplies the backlight duration set on the radio by 2. A set value of 5 would then corresponds to 10 seconds of backlight.", 0);
        }

        apply(firmwareData) {
            const offset = 0x5976;
            const oldData = hexString("40");
            const newData = hexString("80");
            if (compareSection(firmwareData, oldData, offset)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_SkipBootscreen extends FirmwareMod {
        constructor() {
            super("Skip Bootscreen", "Skips the bootscreen and instantly goes to the main screen on powerup.", 0);
        }

        apply(firmwareData) {
            const offset = 0xd1e6;
            const oldData = hexString("fcf7a9fc");
            const newData = hexString("00bf00bff8f7b9fb00f002f8");
            if (compareSection(firmwareData, oldData, offset)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_MenuStrings extends FirmwareMod {
        constructor() {
            super("Menu strings", "Changes text in the settings menu. The displayed JSON contains every string with offset, description and size. Only edit the string and dont use more characters than allowed by the size.", 0);

            // the  b l o c k
            const strings = [{ "offset": 56470, "description": "squelch", "size": 6, "string": "SQLCH" }, { "offset": 56477, "description": "step", "size": 6, "string": "STEP" }, { "offset": 56484, "description": "txpower", "size": 6, "string": "TXPWR" }, { "offset": 56491, "description": "r dcs", "size": 6, "string": "R_DCS" },
            { "offset": 56498, "description": "r ctcs", "size": 6, "string": "R_CTCS" }, { "offset": 56505, "description": "t dcs", "size": 6, "string": "T_DCS" }, { "offset": 56512, "description": "t ctcs", "size": 6, "string": "T_CTCS" }, { "offset": 56519, "description": "tx shift direction", "size": 6, "string": "SHFT-D" },
            { "offset": 56526, "description": "tx shift offset", "size": 6, "string": "OFFSET" }, { "offset": 56533, "description": "wide/narrow", "size": 6, "string": "BNDWDH" }, { "offset": 56540, "description": "scramble", "size": 6, "string": "SCRMBL" }, { "offset": 56547, "description": "busy channel ptt lock", "size": 6, "string": "BUSYLK" },
            { "offset": 56554, "description": "save channel", "size": 6, "string": "MEM-CH" }, { "offset": 56561, "description": "battery saver", "size": 6, "string": "BATSVR" }, { "offset": 56568, "description": "voice activated mode", "size": 6, "string": "VOXPTT" },
            { "offset": 56575, "description": "backlight timeout", "size": 6, "string": "BKLGHT" }, { "offset": 56582, "description": "dual watch", "size": 6, "string": "DUALRX" }, { "offset": 56589, "description": "cross band mode", "size": 6, "string": "CROSS" }, { "offset": 56596, "description": "key beep", "size": 6, "string": "BEEP" },
            { "offset": 56603, "description": "tx timeout", "size": 6, "string": "TXTIME" }, { "offset": 56610, "description": "voice prompt", "size": 6, "string": "VOICE" }, { "offset": 56617, "description": "scan mode", "size": 6, "string": "SCANMD" }, { "offset": 56624, "description": "channel display mode", "size": 6, "string": "CHDISP" },
            { "offset": 56631, "description": "auto keypad lock", "size": 6, "string": "AUTOLK" }, { "offset": 56638, "description": "ch in scan list 1", "size": 6, "string": "S-ADD1" }, { "offset": 56645, "description": "ch in scan list 2", "size": 6, "string": "S-ADD2" }, { "offset": 56652, "description": "tail tone elimination", "size": 6, "string": "STE" },
            { "offset": 56659, "description": "repeater tail tone elimination", "size": 6, "string": "RP-STE" }, { "offset": 56666, "description": "mic sensitivity", "size": 6, "string": "MIC" }, { "offset": 56673, "description": "one key call channel", "size": 6, "string": "1-CALL" },
            { "offset": 56680, "description": "active scan list", "size": 6, "string": "S-LIST" }, { "offset": 56687, "description": "browse scan list 1", "size": 6, "string": "SLIST1" }, { "offset": 56694, "description": "browse scan list 2", "size": 6, "string": "SLIST2" }, { "offset": 56701, "description": "alarm mode", "size": 6, "string": "AL-MOD" },
            { "offset": 56708, "description": "dtmf radio id", "size": 6, "string": "ANI-ID" }, { "offset": 56715, "description": "dtmf upcode", "size": 6, "string": "UPCODE" }, { "offset": 56722, "description": "dtmf downcode", "size": 6, "string": "DWCODE" }, { "offset": 56729, "description": "dtmf using keypad while ptt", "size": 6, "string": "D-ST" },
            { "offset": 56736, "description": "dtmf response mode", "size": 6, "string": "D-RSP" }, { "offset": 56743, "description": "dtmf hold time", "size": 6, "string": "D-HOLD" }, { "offset": 56750, "description": "dtmf pre-load time", "size": 6, "string": "D-PRE" },
            { "offset": 56757, "description": "dtmf transmit id on ptt", "size": 6, "string": "PTT-ID" }, { "offset": 56764, "description": "dtmf only listen to contacts", "size": 6, "string": "D-DCD" }, { "offset": 56771, "description": "dtmf list/call contacts", "size": 6, "string": "D-LIST" },
            { "offset": 56778, "description": "power on screen", "size": 6, "string": "PONMSG" }, { "offset": 56785, "description": "end of talk tone", "size": 6, "string": "ROGER" }, { "offset": 56792, "description": "battery voltage", "size": 6, "string": "VOL" }, { "offset": 56799, "description": "enable AM reception on AM bands", "size": 6, "string": "AM" },
            { "offset": 56806, "description": "enable NOAA scan", "size": 6, "string": "NOAA_S" }, { "offset": 56813, "description": "delete channel", "size": 6, "string": "DEL-CH" }, { "offset": 56820, "description": "reset radio", "size": 6, "string": "RESET" }, { "offset": 56827, "description": "enable tx on 350mhz band", "size": 6, "string": "350TX" },
            { "offset": 56834, "description": "limit to local ham frequencies", "size": 6, "string": "F-LOCK" }, { "offset": 56841, "description": "enable tx on 200mhz band", "size": 6, "string": "200TX" }, { "offset": 56848, "description": "enable tx on 500mhz band", "size": 6, "string": "500TX" },
            { "offset": 56855, "description": "enable 350mhz band", "size": 6, "string": "350EN" }, { "offset": 56862, "description": "enable scrambler option", "size": 6, "string": "SCRMBL" }, { "offset": 56869, "description": "battery saver: off", "size": 3, "string": "OFF" }, { "offset": 56873, "description": "battery saver: 1:1", "size": 3, "string": "1:1" },
            { "offset": 56877, "description": "battery saver: 1:2", "size": 3, "string": "1:2" }, { "offset": 56881, "description": "battery saver: 1:3", "size": 3, "string": "1:3" }, { "offset": 56885, "description": "battery saver: 1:4", "size": 3, "string": "1:4" }, { "offset": 56889, "description": "tx power: low", "size": 4, "string": "LOW" },
            { "offset": 56894, "description": "tx power: mid", "size": 4, "string": "MID" }, { "offset": 56899, "description": "tx power: high", "size": 4, "string": "HIGH" }, { "offset": 56904, "description": "bandwidth: wide", "size": 6, "string": "WIDE" }, { "offset": 56911, "description": "bandwidth: narrow", "size": 6, "string": "NARROW" },
            { "offset": 56918, "description": "multiple options 1: off", "size": 6, "string": "OFF" }, { "offset": 56925, "description": "multiple options 1: chan a", "size": 6, "string": "CHAN_A" }, { "offset": 56932, "description": "multiple options 1: chan b", "size": 6, "string": "CHAN_B" },
            { "offset": 56939, "description": "multiple options 2: off", "size": 3, "string": "OFF" }, { "offset": 56943, "description": "multiple options 2: on", "size": 3, "string": "ON" }, { "offset": 56947, "description": "voice prompt: off", "size": 3, "string": "OFF" }, { "offset": 56951, "description": "voice prompt: chinese", "size": 3, "string": "CHI" },
            { "offset": 56955, "description": "voice prompt: english", "size": 3, "string": "ENG" }, { "offset": 56959, "description": "dtmf ptt id: off", "size": 4, "string": "OFF" }, { "offset": 56964, "description": "dtmf ptt id: upcode on ptt", "size": 4, "string": "BOT" },
            { "offset": 56969, "description": "dtmf ptt id: downcode after ptt", "size": 4, "string": "EOT" }, { "offset": 56974, "description": "dtmf ptt id: both", "size": 4, "string": "BOTH" }, { "offset": 56979, "description": "scan mode: continue after 5s", "size": 2, "string": "TO" },
            { "offset": 56982, "description": "scan mode: stay while signal", "size": 2, "string": "CO" }, { "offset": 56985, "description": "scan mode: stop on signal", "size": 2, "string": "SE" }, { "offset": 56988, "description": "channel display mode: freq", "size": 4, "string": "FREQ" },
            { "offset": 56993, "description": "channel display mode: chan", "size": 4, "string": "CHAN" }, { "offset": 56998, "description": "channel display mode: name", "size": 4, "string": "NAME" }, { "offset": 57003, "description": "tx shift direction: off", "size": 4, "string": "OFF" },
            { "offset": 57007, "description": "tx shift direction: +", "size": 4, "string": "+" }, { "offset": 57011, "description": "tx shift direction: -", "size": 4, "string": "-" }, { "offset": 57015, "description": "alarm mode: local", "size": 4, "string": "SITE" }, { "offset": 57020, "description": "alarm mode: local + remote", "size": 4, "string": "TONE" },
            { "offset": 57025, "description": "power on screen: full", "size": 4, "string": "FULL" }, { "offset": 57030, "description": "power on screen: custom message", "size": 4, "string": "MSG" }, { "offset": 57035, "description": "power on screen: batt voltage", "size": 4, "string": "BATT" },
            { "offset": 57040, "description": "reset: keep channel parameters", "size": 3, "string": "VFO" }, { "offset": 57044, "description": "reset: reset everything", "size": 3, "string": "ALL" }, { "offset": 57048, "description": "dtmf response: nothing", "size": 5, "string": "NULL" },
            { "offset": 57054, "description": "dtmf response: local ring", "size": 5, "string": "RING" }, { "offset": 57060, "description": "dtmf response: auto call back", "size": 5, "string": "REPLY" }, { "offset": 57066, "description": "dtmf response: ring and call", "size": 5, "string": "BOTH" },
            { "offset": 57072, "description": "end of talk tone: off", "size": 5, "string": "OFF" }, { "offset": 57078, "description": "end of talk tone: classic beep", "size": 5, "string": "ROGER" }, { "offset": 57084, "description": "end of talk tone: MDC ID sound", "size": 5, "string": "MDC" },
            { "offset": 57090, "description": "f lock: none", "size": 3, "string": "OFF" }, { "offset": 57094, "description": "f lock: region FCC", "size": 3, "string": "FCC" }, { "offset": 57098, "description": "f lock: region Europe", "size": 3, "string": "CE" }, { "offset": 57102, "description": "f lock: region GB", "size": 3, "string": "GB" },
            { "offset": 57106, "description": "f lock: 430 band", "size": 3, "string": "430" }, { "offset": 57110, "description": "f lock: 438 band", "size": 3, "string": "438" }];

            this.menuStringsTextarea = document.createElement("textarea");
            this.menuStringsTextarea.classList.add("w-100", "form-control");
            this.menuStringsTextarea.placeholder = "There should be JSON here, reload the page to get it back!";
            this.menuStringsTextarea.value = JSON.stringify(strings, null, 2);

            this.modSpecificDiv.appendChild(this.menuStringsTextarea);
        }

        apply(firmwareData) {
            const jsonData = JSON.parse(this.menuStringsTextarea.value);
            const encoder = new TextEncoder();

            jsonData.forEach(({ offset, size, string }) => {
                const encodedString = encoder.encode(string);
                const padding = new Uint8Array(size - encodedString.length);
                const paddedString = new Uint8Array(encodedString.length + padding.length);
                paddedString.set(encodedString);
                paddedString.set(padding, encodedString.length);

                firmwareData = replaceSection(firmwareData, paddedString, offset);
            });

            log(`Success: ${this.name} applied.`);
            return firmwareData;
        }

    }
    ,
    class Mod_MicGain extends FirmwareMod {
        constructor() {
            super("Increase Mic Gain", "Gives the microphone gain an additional boost, making the microphone generally more sensitive.", 0);
        }

        apply(firmwareData) {
            const offset = 0xa8e4;
            const offset2 = 0x1c94;
            const oldData = hexString("40e90000");
            const newData = hexString("4fe90000");

            if (compareSection(firmwareData, oldData, offset) && compareSection(firmwareData, oldData, offset2)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                firmwareData = replaceSection(firmwareData, newData, offset2);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_NegativeDisplay extends FirmwareMod {
        constructor() {
            super("Negative Display", "Inverts the colors on the display.", 0);
        }

        apply(firmwareData) {
            const offset = 0xb798;
            const oldData = hexString("a6");
            const newData = hexString("a7");
            if (compareSection(firmwareData, oldData, offset)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_RogerBeep extends FirmwareMod {
        constructor() {
            super("Roger Beep", "Changes the pitch of the two roger beep tones. Tone 1 plays for 150ms and tone 2 for 80ms. The defaults in this mod are similar to the Mototrbo beep. The maximum is 6347 Hz. ", 0);
            this.inputTone1 = addInputField(this.modSpecificDiv, "Tone 1 frequency (Hz)", "1540");
            this.inputTone2 = addInputField(this.modSpecificDiv, "Tone 2 frequency (Hz)", "1310");
        }

        apply(firmwareData) {
            const offset = 0xaed0;
            const tone1 = Math.trunc(parseInt(this.inputTone1.value) * 10.32444);
            const tone2 = Math.trunc(parseInt(this.inputTone2.value) * 10.32444);

            if (tone1 <= 0xFFFF && tone2 <= 0xFFFF) {
                // Create an 8-byte buffer with the specified values
                const buffer = new ArrayBuffer(8);
                const dataView = new DataView(buffer);

                // Set tone1 and tone2 at their respective offsets
                dataView.setUint32(0, tone1, true); // true indicates little-endian byte order
                dataView.setUint32(4, tone2, true);

                // Convert the buffer to a Uint8Array
                const tonesHex = new Uint8Array(buffer);

                // Replace the 8-byte section at the offset with the new buffer
                firmwareData = replaceSection(firmwareData, tonesHex, offset);
                firmwareData = replaceSection(firmwareData, hexString("96"), 0xae9a);

                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_RSSI extends FirmwareMod {
        constructor() {
            super("RSSI", "Experimental mod. Adds a battery voltage readout in the status bar. Replaces the signal strength meter with a numerical RSSI readout and adds another optional element: You can choose to either have an s-meter with bargraph (signal strength in 6dB increments) or an RSSI graph showing RSSI over time.", "2250 or 1424");

            this.selectSbar = addRadioButton(this.modSpecificDiv, "Select S-Meter, uses 2250 Bytes of additional Flash", "selectSbar", "selectRSSI");
            this.selectGraph = addRadioButton(this.modSpecificDiv, "Select RSSI Graph, uses 1424 Bytes of additional Flash CURRENTLY BROKEN", "selectGraph", "selectRSSI");
            this.selectSbar.checked = true;
            this.selectGraph.disabled = true; // currently broken, doesnt boot and python variant of the mod doesnt seem to do anything

        }

        apply(firmwareData) {
            firmwareData = replaceSection(firmwareData, hexString("e7e50000"), 0x0004); // replace reset handler
            firmwareData = replaceSection(firmwareData, hexString("1de70000"), 0x003c); // replace systick handler
            firmwareData = replaceSection(firmwareData, hexString("02e0"), 0x14bc); // remove old signal strength meter


            // sbar size 2242 + 8 = 2250
            const dataSbar = hexString("10b5064c2378002b07d1054b002b02d0044800e000bf0123237010bda813002000000000c0000000044b10b5002b03d00349044800e000bf10bdc04600000000ac130020c00000000023c25c0133002afbd1581e704700207047d308db015918e0239b00994207d807231a40063b93404068425c134343547047406840187047002070470a00303a0300d0b2092805d900202d2901d15868463070470720424358688018f9e708207047072070470020704770477047e02210b500214068920000f095fb10bd10b5d523984710bd0000f8b5c36804005a1cc260c72a4cd9294b002519780123ff3948424841217c9943014304202174244909688b432349db000978890001400b43217c083081430b432374530709d123681868a84205d02100036808315b68984705006668002e1bd0e368db0718d4164b9847217ec7b28f420ad063695868ff2917d1002803d0390003689b68984727762100336830001b68083198470543edb2ab0701d5094b9847eb0701d5084b9847f8bd0028ebd00368db68e7e735080020001006401e0a0020b9b0000039b60000b1b60000f7b5040004265f20144fb8470190a068002809d0237b628a023b9a4204da801801a9022200f00cfb638a013e02339bb2f6b26382002ee6d1257bab420dd30b202674b84702002068002806d06368002b03d0d2062900d20f9847f7bd61a9000070b51a4c2378002b05d100f0b5fa00f0c3fa01232370164b1b68db071fd5154d2b7c012b1bd13f20134ca047c021030089010b408b4203d00143104b3f2098470c20a047c3070ad502200c4b002198470220a047c30402d52800fff7a1ff0848fff738ff074b984770bdc0462414002000100640e813002061a9000001af0000cc13002099c30000f8b5040040680d0000281fd003685b68984707002068218903689b6898470600606829000368db6898470200002e05d039003000002f0bd000f08efa606829000368db68984723891b1823810020f8bd00f08bfaf2e770b506000d0000242800fff7b0fe844206d2295d30000134fff7c7ffe4b2f3e770bdf0b50c00002187b017000190072204a81e00039100f06dfa002c04da2d210198fff7b2ff6442194b0093002319000822d21a974219dc009a126a94460022a44503dc60460132241af9e7302084469444654603a8c554002a02d0002900d11900009a0133043a0092e1e703ab002901d130221a70002e02d00921c91b891b01985918fff7acff07b0f0bdc04664ed0000f0b50c0087b00da909781600e3180caa0500127805910193802b01dd802301936b461b790393b3180293382b01dd382302936b4637001b7a0493049b9f4210d228683a00036821005b689847039b2868591e03683a005b68c9b201379847ffb2ebe72700039b9f4210d228683900036832005b689847049b28685a1e036839005b68d2b201379847ffb2ebe7059b002b13d0019b0134e4b2013b9c420dda771c029bffb2013b9f42f3da28683a00036821005b6898470137f2e707b0f0bd0000f0b50b7a04000d0087b01b0700d511e10b681b68002b06d0874b01201b78002b34d007b0f0bd83685a1c82605b07f3d0824b834e1a6801235209934343740c20b047b4467f49830702d4627c002a01d000220a700a787c480a2a06d82f7a01263b003340029337423ed00178002900d0e0e00124754b04708022186800f091f92b7a234200d0d5e00220cae7704b01201b78002bc5d16f4b1d88fa239b009d4200d96d4d142200216c4800f07af94d236b4c02222900200023814c3bfff7f8fe02226021674800f06cf958230022290020002381563bfff7ebfe05226249634800f056f901209ce7029b01320a700370627c002a5ed06f20e0473f220d2382435343a2819b11514fa37380220021386800f047f90c23e65ec023554d5b002b81002e03dd20212800fff786fe0323002231002800fff7bcfe637c002b53d03e680f2230004b49233000f022f93300343621331a78d2431a700133b342f9d1a37b1c1c0d2b00d90d24e4b2029b9c428bd06b46029a1b7a062a00d90623052102980133dbb2009300271f2341430820009a029e9a1a3b00b0427f41403104332800d2b2c9b20197fff7cbfe029b0133dbb20293dae76720e0474008c0b20200a023a03a181a2c49029b12b20d780133dbb2a84203da01310d2bf7d1013391b2090a227361738fe7a37b05ae032230002349039300f0cdf83868039b08222330092b0fd91f4900f0c4f830237370039b27333370ac23ff33310028002b81fff737fe9de7184900f0b4f8039b3033337020237370eee70020f4e6ea0600200010064061a90000a5130020a413002020140020e306002006040020e7030000d106002098130020d9060020aed40000eb0600208c13002062d4000054ed00001eed00009dd30000b5d30000164b1749174a19605a60174b174a18481a60184a5a60184a506011600022174917484a600a600a744a821649083008608a600a8214494b6014494b60144b15495a601960da60191d1a74ff3299605b611a76114b114a1a607047c046c41300202ced0000040700201814002044ed00008406002020d6000010140020e81300208ced0000fc1300208c13002098130020cc13002088ed00002014002084080020044b054a0548834202d202ca02c3fae77047c0468c130020c8ed0000a613002070b500260c4d0d4c641ba410a64209d1002600f06df80a4d0a4c641ba410a64205d170bdb300eb5898470136eee7b300eb5898470136f2e7bced0000bced0000bced0000c4ed0000002310b59a4200d110bdcc5cc4540133f8e703008218934200d1704719700133f9e7202000000000000000000000000077e500007be500009be50000d7e500000000000000000000a1e50000a5e50000c7e50000cbe500008d87817b756f69635d53493f35000000010000000a00000064000000e803000010270000a086010040420f008096980000e1f505fc1300200000000000000000cfe500006de90000d3e50000d5e50000f8b5c046f8bc08bc9e467047f8b5c046f8bc08bc9e46704749e50000f5eb000021e50000c4130020000000000000000010140020000000000000000001ff");
            // graph size 1416 + 8 = 1424
            const dataGraph = hexString("10b5064c2378002b07d1054b002b02d0044800e000bf0123237010bd9413002000000000c0000000044b10b5002b03d00349044800e000bf10bdc0460000000098130020c00000000023c25c0133002afbd1581e70470000002243088b4274d303098b425fd3030a8b4244d3030b8b4228d3030c8b420dd3ff22090212ba030c8b4202d31212090265d0030b8b4219d300e0090ac30b8b4201d3cb03c01a5241830b8b4201d38b03c01a5241430b8b4201d34b03c01a5241030b8b4201d30b03c01a5241c30a8b4201d3cb02c01a5241830a8b4201d38b02c01a5241430a8b4201d34b02c01a5241030a8b4201d30b02c01a5241cdd2c3098b4201d3cb01c01a524183098b4201d38b01c01a524143098b4201d34b01c01a524103098b4201d30b01c01a5241c3088b4201d3cb00c01a524183088b4201d38b00c01a524143088b4201d34b00c01a5241411a00d20146524110467047ffe701b5002000f006f802bdc0460029f7d076e770477047c04600207047d308db015918e0239b00994207d807231a40063b93404068425c134343547047406840187047002070470a00303a0300d0b2092805d900202d2901d15868463070470720424358688018f9e70820704707207047e02210b500214068920000f064f910bd10b5d523984710bdf8b5040040680d0000281fd003685b68984707002068218903689b6898470600606829000368db6898470200002e05d039003000002f0bd000f038f9606829000368db68984723891b1823810020f8bd00f035f9f2e70000f0b5594b8bb003934b680025069303ab07936b469d84554b0c68554a1b6805af0600049405920895db0729d50c20736998475049830700d50d700b784e4a142b04d83220ff30205cff281bd11578002d16d1012304981370813080222900ff3000f001f960222900444800f0fcf8444b1d703223ff33e35cff2b01d0b36998470bb0f0bd01330b70002313706a468133ff3301ad93843b4905222800089700f0d9f86720736998474008c0b20028e7d0a02826d920236030c4b22b7064212000fff7aefe30300a2168702000fff7a8fe0a21c0b2fff72aff3031a97020000a21fff724ff00273031e9702800fff790fe87420cd2e95d07a80137fff755ffffb2f3e760246442241a2d23e4b2d5e71c4f3b78203b5f2b01d920233b7007235c431c413d781549221c4819e4b220389c4200d91a1cd2b29a1aff231341db4303707b2d08d800232a0018001f3a8a18d0540133042bfbd104986022a130ff30013500f078f83d7089e7dce9000000100640f4e900008c1300208d130020b013002010140020cee9000010b50e4c2378002b05d100f02bf800f039f8012323700a4b19684a1c1a60094b4b4309498b4205d8c82a03d907490848fff722ff074b984710bdc0461c14002090130020efeeeeee1111111104ea00001cea000099c30000014b5a1c5a60704714140020044b054a0548834202d202ca02c3fae77047c0468c130020a0ea00009413002070b500260c4d0d4c641ba410a64209d1002600f081f80a4d0a4c641ba410a64205d170bdb300eb5898470136eee7b300eb5898470136f2e794ea000094ea000094ea00009cea0000002310b59a4200d110bdcc5cc4540133f8e703008218934200d1704719700133f9e7673030300000000000000000000091e6000095e60000b5e60000e9e600000000000000000000bbe60000bfe60000e1e60000e5e600000407002020d6000048d30000b303002084060020060400204d870000edd0000001d1000045be000001af000061a9000039b60000b9b00000e9c600000d8700004d8600007da6000019a50000cda7000029010000bdaa0000d5aa0000d91c00003da6000095a70000b1b60000119c0000d500000099c30000f8b5c046f8bc08bc9e467047f8b5c046f8bc08bc9e46704749e5000039e9000021e50000ff01000001000000");

            if (this.selectSbar.checked) {
                firmwareData = replaceSection(firmwareData, dataSbar, firmwareData.length);

                log(`Success: ${this.name} S-Meter applied.`);
            }
            else if (this.selectGraph.checked) {
                firmwareData = replaceSection(firmwareData, dataGraph, firmwareData.length);

                log(`Success: ${this.name} Graph applied.`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_EnableSWDPort extends FirmwareMod {
        constructor() {
            super("Enable SWD Port", "If you don't know what SWD is, you don't need this mod! Allows debugging via SWD. You will need to solder wires to the main board of the radio and connect them to specialized hardware. ", 0);
        }

        apply(firmwareData) {
            const offset1 = 0xb924;
            const offset2 = 0xb9b2;
            const oldData1 = hexString("c860");
            const oldData2 = hexString("4860");
            const newData = hexString("00bf");
            if (compareSection(firmwareData, oldData1, offset1) && compareSection(firmwareData, oldData2, offset2)) {
                firmwareData = replaceSection(firmwareData, newData, offset1);
                firmwareData = replaceSection(firmwareData, newData, offset2);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_FrequencyRangeSimple extends FirmwareMod {
        constructor() {
            super("Larger Frequency Range", "Changes the lower limit of Band 1 to 18 MHz and the upper limit of Band 7 to 1300 MHz for RX. TX ranges are not affected. ", 0);
        }

        apply(firmwareData) {
            const offset = 0xe074;
            const oldData = hexString("404b4c0080cba4000085cf00c0800901c00e1602005a6202c029cd0280f77300f684cf00b6800901b60e1602f6596202b629cd0200879303");
            const newData = hexString("40771b0080cba4000085cf00c0800901c00e1602005a6202c029cd0280f77300f684cf00b6800901b60e1602f6596202b629cd0280a4bf07");
            if (compareSection(firmwareData, oldData, offset)) {
                firmwareData = replaceSection(firmwareData, newData, offset);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
    class Mod_FrequencySteps extends FirmwareMod {
        constructor() {
            super("Frequency Steps", "Changes the frequency steps.", 0);
            this.inputStep1 = addInputField(this.modSpecificDiv, "Frequency Step 1 (Hz)", "2500");
            this.inputStep2 = addInputField(this.modSpecificDiv, "Frequency Step 2 (Hz)", "5000");
            this.inputStep3 = addInputField(this.modSpecificDiv, "Frequency Step 3 (Hz)", "6250");
            this.inputStep4 = addInputField(this.modSpecificDiv, "Frequency Step 4 (Hz)", "10000");
            this.inputStep5 = addInputField(this.modSpecificDiv, "Frequency Step 5 (Hz)", "12500");
            this.inputStep6 = addInputField(this.modSpecificDiv, "Frequency Step 6 (Hz)", "25000");
            this.inputStep7 = addInputField(this.modSpecificDiv, "Frequency Step 7 (Hz) (only available on band 2)", "8330");
        }

        apply(firmwareData) {
            const offset = 0xE0C8;

            const steps = [
                Math.trunc(parseInt(this.inputStep1.value) * 0.1),
                Math.trunc(parseInt(this.inputStep2.value) * 0.1),
                Math.trunc(parseInt(this.inputStep3.value) * 0.1),
                Math.trunc(parseInt(this.inputStep4.value) * 0.1),
                Math.trunc(parseInt(this.inputStep5.value) * 0.1),
                Math.trunc(parseInt(this.inputStep6.value) * 0.1),
                Math.trunc(parseInt(this.inputStep7.value) * 0.1),
            ];

            // Create an 8-byte buffer with the specified values
            const buffer = new ArrayBuffer(14);
            const dataView = new DataView(buffer);

            // Set each step at their respective offsets
            for (let i = 0; i < steps.length; i++) {
                dataView.setUint16(i * 2, steps[i], true); // true indicates little-endian byte order
            }

            // Convert the buffer to a Uint8Array
            const stepsHex = new Uint8Array(buffer);

            // Replace the 14-byte section at the offset with the new buffer
            firmwareData = replaceSection(firmwareData, stepsHex, offset);

            log(`Success: ${this.name} applied.`);
            return firmwareData;
        }
    }
    ,
    class Mod_NOAAFrequencies extends FirmwareMod {
        constructor() {
            super("NOAA Frequencies", "The NOAA scan feature is unique because it can scan in the background, all the time. However, most people dont need the weather alerts or dont have NOAA in their country. This mod lets you change the frequencies so you can use the NOAA scan function for something else, but keep in mind that the radio needs the 1050hz tone burst to open squelch. The values below are pre-set to the first 10 PMR446 channels. ", 0);
            this.inputFreq1 = addInputField(this.modSpecificDiv,   "Frequency 1 (Hz)", "446006250");
            this.inputFreq2 = addInputField(this.modSpecificDiv,   "Frequency 2 (Hz)", "446018750");
            this.inputFreq3 = addInputField(this.modSpecificDiv,   "Frequency 3 (Hz)", "446031250");
            this.inputFreq4 = addInputField(this.modSpecificDiv,   "Frequency 4 (Hz)", "446043750");
            this.inputFreq5 = addInputField(this.modSpecificDiv,   "Frequency 5 (Hz)", "446056250");
            this.inputFreq6 = addInputField(this.modSpecificDiv,   "Frequency 6 (Hz)", "446068750");
            this.inputFreq7 = addInputField(this.modSpecificDiv,   "Frequency 7 (Hz)", "446081250");
            this.inputFreq8 = addInputField(this.modSpecificDiv,   "Frequency 8 (Hz)", "446093750");
            this.inputFreq9 = addInputField(this.modSpecificDiv,   "Frequency 9 (Hz)", "446106250");
            this.inputFreq10 = addInputField(this.modSpecificDiv,  "Frequency 10 (Hz)", "446118750");
        }

        apply(firmwareData) {
            const offset = 0xE0D8;

            const freqs = [
                Math.trunc(parseInt(this.inputFreq1.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq2.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq3.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq4.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq5.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq6.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq7.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq8.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq9.value) * 0.1),
                Math.trunc(parseInt(this.inputFreq10.value) * 0.1)
            ];

            // Create an 8-byte buffer with the specified values
            const buffer = new ArrayBuffer(40);
            const dataView = new DataView(buffer);

            // Set each step at their respective offsets
            for (let i = 0; i < freqs.length; i++) {
                dataView.setUint32(i * 4, freqs[i], true); // true indicates little-endian byte order
            }

            // Convert the buffer to a Uint8Array
            const freqsHex = new Uint8Array(buffer);

            // Replace the 14-byte section at the offset with the new buffer
            firmwareData = replaceSection(firmwareData, freqsHex, offset);

            log(`Success: ${this.name} applied.`);
            return firmwareData;
        }
    }
    ,
    class Mod_AMOnAllBands extends FirmwareMod {
        constructor() {
            super("AM RX on all Bands", "For some reason, the original firmware only allows the AM setting to work on band 2. This mod allows AM to work on any band.", 0);
        }

        apply(firmwareData) {
            const offset1 = 0x6232;
            const offset2 = 0x6246;
            const offset3 = 0x624c;
            const oldData1 = hexString("0b");
            const oldData2 = hexString("01");
            const oldData3 = hexString("b07b");
            const newData1 = hexString("0e");
            const newData2 = hexString("04");
            const newData3 = hexString("01e0");
            if (compareSection(firmwareData, oldData1, offset1) && compareSection(firmwareData, oldData2, offset2) && compareSection(firmwareData, oldData3, offset3)) {
                firmwareData = replaceSection(firmwareData, newData1, offset1);
                firmwareData = replaceSection(firmwareData, newData2, offset2);
                firmwareData = replaceSection(firmwareData, newData3, offset3);
                log(`Success: ${this.name} applied.`);
            }
            else {
                log(`ERROR in ${this.name}: Unexpected data, already patched or wrong firmware?`);
            }

            return firmwareData;
        }
    }
    ,
]
