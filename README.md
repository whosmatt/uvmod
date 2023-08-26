# [CLICK HERE TO OPEN UVMOD](https://whosmatt.github.io/uvmod/)
## [中文版 Open Chinese Version (maintained independently)](https://uvmod.xanyi.eu.org/)
## [Open Russian Version (maintained independently)](https://uvmod.valek.net.ru/)
## [Open Portuguese Version (maintained independently)](https://meshtastic.pt/QuanSheng/)

### Info about v26/v27

UVMOD is based on v26 because the newer v27 firmware brings no important changes other than one small fix that only applies to a small number of units.  
Depending on the factory calibration of some radios, the TX power above 435MHz can be lower than it should be due to a programming oversight.  
v27 fixes this so that the TX power is always correct.
To see if your unit is affected you can either use a power meter, or you can use a receiver with rssi to check if the output power on the L setting is higher than the output power on the H setting. 

For now, the russian and portuguese version of UVMOD includes limited v27 support, so you can use those if your unit is affected.  

We are working on a mod that fixes this in v26 as well.  

## Introduction

Web-based client-side Quansheng firmware patcher and Web Serial flasher written in Javascript and HTML using [Bootstrap 4.6.0](https://getbootstrap.com/docs/4.6/getting-started/introduction/), jQuery and parts of the [SB Admin 2 Theme](https://startbootstrap.com/theme/sb-admin-2).  
It is based on the discoveries by the many contributors in the [uvmod-kitchen](https://github.com/amnemonic/Quansheng_UV-K5_Firmware/tree/main/uvmod_kitchen) and implements the same functionality in a modular and flexible javascript structure. 

Visitors can generate a patched firmware image by selecting the desired patches. Patches modify the firmware on a binary level and can accept user input to customize variables. A custom base image can be supplied to allow support for mods that are compiled and linked directly into the firmware.  
The generated firmware can be flashed directly to the radio with supported browsers, no external software is needed. 

## Mod development

Clone this repository and execute `python3 -m http.server` or `python -m http.server` in the root directory for an instant local web server, allowing easy testing.  
Mods are defined in [mods.js](mods.js), with an example mod to outline the pattern.  
Also __refer to the helper functions and documentation in__ [modframework.js](js/modframework.js).  

The supported format for binary data is in the format of a hex string __without separators__. You can use find and replace to remove all `\x` from a regular hex string or directly export the correct format from a bytes object in python using `print(''.join('%02x'%i for i in BYTES_OBJECT))`.

## Statement regarding dangerous clones of UVMOD

The radio spectrum is used by many different people and organizations, some of which are very important to critical infrastructure. Modifying the firmware of a radio needs to be done with care and consideration for the consequences.  
UVMOD makes it easy and accessible for anyone without any background knowledge to modify the firmware of their radio. __However, certain mods such as TX Unlock mods can not be used legally and safely without a certain amount of background knowledge because the behaviour of these mods is counterintuitive.__  
UVMOD is designed to hide all high-risk mods behind a information section in the instructions to ensure that users are aware of the risks and consequences.  

__Sadly, there has been one person (RE3CON) who has cloned UVMOD and removed all of the safety precautions and warnings.__ The team behind UVMOD and the Quansheng modding scene do not condone this behavior and we strongly advise against using this clone.  
__Use the links at the top of this file to access all approved versions.__

## Code of Conduct

For the reasons outlined above, we have decided to implement a code of conduct for this project.  
While we can not stop intentional abuse of the software for illegal purposes, we must at least try to prevent accidental abuse.  
To accomplish this:
- Mods are considered dangerous when they can be abused to break the law or cause harm to others.
- Mods that are considered dangerous must be hidden using the this.hidden property.
- Mods that are considered dangerous must have a clear description and an unambiguous title.  

Failing to follow the rules above on a fork/clone of the main project may result in a negative public statement and/or a DMCA takedown request from the contributors involved.  

To further improve the quality of the main project, we also ask that you:
- Only include mods that function correctly and have been tested.  
- Only include mods that work without side effects (or at least document the side effects in the description).  
- Avoid putting credit to yourself in the Mod title or description. Any work you do on this project is a collaborative effort building on the work of the people before you, and claiming sole credit for a mod is not in the spirit of this project.  