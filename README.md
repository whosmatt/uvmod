# [CLICK HERE TO OPEN UVMOD](https://whosmatt.github.io/uvmod/)
## [中文版 Open Chinese Version (maintained independently)](https://uvmod.xanyi.eu.org/)

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
