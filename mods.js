modClasses = [
    class Mod_Example extends FirmwareMod {
        constructor() {
            super("Example Mod", "This mod does absolutely nothing and is used as an example for implementing new mods", 0); // Add name, description and size (additional flash used, 0 for most mods)

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
                log("Applied battery icon mod...");
            }
            else {
                log("ERROR: Unexpected data, battery icon already patched?");
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
            { "offset": 56855, "description": "enable 350mhz band", "size": 6, "string": "350EN" }, { "offset": 56862, "description": "enable scrambler option", "size": 6, "string": "SCREN" }, { "offset": 56869, "description": "battery saver: off", "size": 3, "string": "OFF" }, { "offset": 56873, "description": "battery saver: 1:1", "size": 3, "string": "1:1" },
            { "offset": 56877, "description": "battery saver: 1:2", "size": 3, "string": "1:2" }, { "offset": 56881, "description": "battery saver: 1:3", "size": 3, "string": "1:3" }, { "offset": 56885, "description": "battery saver: 1:4", "size": 3, "string": "1:4" }, { "offset": 56889, "description": "tx power: low", "size": 4, "string": "LOW" },
            { "offset": 56894, "description": "tx power: mid", "size": 4, "string": "MID" }, { "offset": 56899, "description": "tx power: high", "size": 4, "string": "HIGH" }, { "offset": 56904, "description": "bandwidth: wide", "size": 6, "string": "WIDE" }, { "offset": 56911, "description": "bandwidth: narrow", "size": 6, "string": "NARROW" },
            { "offset": 56918, "description": "multiple options 1: off", "size": 6, "string": "OFF" }, { "offset": 56925, "description": "multiple options 1: chan a", "size": 6, "string": "CHAN_A" }, { "offset": 56932, "description": "multiple options 1: chan b", "size": 6, "string": "CHAN_B" },
            { "offset": 56939, "description": "multiple options 2: off", "size": 3, "string": "OFF" }, { "offset": 56943, "description": "multiple options 2: on", "size": 3, "string": "ON" }, { "offset": 56947, "description": "voice prompt: off", "size": 3, "string": "OFF" }, { "offset": 56951, "description": "voice prompt: chinese", "size": 3, "string": "CHI" },
            { "offset": 56955, "description": "voice prompt: english", "size": 3, "string": "ENG" }, { "offset": 56959, "description": "dtmf ptt id: off", "size": 4, "string": "OFF" }, { "offset": 56964, "description": "dtmf ptt id: upcode on ptt", "size": 4, "string": "BOT" },
            { "offset": 56969, "description": "dtmf ptt id: downcode after ptt", "size": 4, "string": "EOT" }, { "offset": 56974, "description": "dtmf ptt id: both", "size": 4, "string": "BOTH" }, { "offset": 56979, "description": "scan mode: continue after 5s", "size": 2, "string": "TO" },
            { "offset": 56982, "description": "scan mode: stay while signal", "size": 2, "string": "CO" }, { "offset": 56985, "description": "scan mode: stop on signal", "size": 2, "string": "SE" }, { "offset": 56988, "description": "channel display mode: freq", "size": 4, "string": "FREQ" },
            { "offset": 56993, "description": "channel display mode: chan", "size": 4, "string": "CHAN" }, { "offset": 56998, "description": "channel display mode: name", "size": 4, "string": "NAME" }, { "offset": 57003, "description": "tx shift direction: off", "size": 4, "string": "OFF" },
            { "offset": 57007, "description": "tx shift direction: +", "size": 4, "string": "+" }, { "offset": 57011, "description": "tx shift direction: -", "size": 4, "string": "-" }, { "offset": 57015, "description": "alarm mode: local", "size": 4, "string": "SITE" }, { "offset": 57020, "description": "alarm mode: local + remote", "size": 4, "string": "TONE" },
            { "offset": 57025, "description": "power on screen: full", "size": 4, "string": "FULL" }, { "offset": 57030, "description": "power on screen: custom message", "size": 4, "string": "MSG" }, { "offset": 57035, "description": "power on screen: batt voltage", "size": 4, "string": "VOL" },
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

            log("Applied menu strings mod...");
            return firmwareData;
        }

    }
]
