// Webserial flasher for Quansheng radios
// VERY EXPERIMENTAL


async function connect() {
    if (!('serial' in navigator)) {
        alert('WebSerial is not supported in this browser. Use a chromium based browser such as Chrome, Edge, Opera...');
        return null;
    }

    try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 38400 });

        return port;
    } catch (error) {
        console.error('Error connecting to the serial port:', error);
        return null;
    }
}

async function disconnect(port) {
    try {
        if (port && port.readable) {
            // Close the port if it's open
            await port.close();
            console.log('Serial port disconnected.');
        } else {
            console.warn('Serial port is not open.');
        }
    } catch (error) {
        console.error('Error closing the serial port:', error);
    }
}


function xor(data) {
    let data_xor = new Uint8Array(data); // prevent mutation of the original data
    const k5_xor_array = new Uint8Array([
        0x16, 0x6c, 0x14, 0xe6, 0x2e, 0x91, 0x0d, 0x40,
        0x21, 0x35, 0xd5, 0x40, 0x13, 0x03, 0xe9, 0x80
    ]);

    for (let i = 0; i < data_xor.length; i++) {
        data_xor[i] ^= k5_xor_array[i % k5_xor_array.length];
    }

    return data_xor;
}


function crc16xmodem(data, crc = 0) {
    const poly = 0x1021;

    for (let i = 0; i < data.length; i++) {
        crc ^= data[i] << 8;

        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ poly;
            } else {
                crc <<= 1;
            }
        }

        crc &= 0xffff;
    }

    return crc;
}


function packetize(data) {
    const header = new Uint8Array([0xab, 0xcd]);
    const length = new Uint8Array([data.length & 0xff, (data.length >> 8) & 0xff]);
    const crc = new Uint8Array([crc16xmodem(data) & 0xff, (crc16xmodem(data) >> 8) & 0xff]);
    const unobfuscatedData = new Uint8Array([...data, ...crc]); // crc is added before xor, and xor is applied to data and crc
    const obfuscatedData = xor(unobfuscatedData);

    const footer = new Uint8Array([0xdc, 0xba]);

    const packet = new Uint8Array([...header, ...length, ...obfuscatedData, ...footer]);
    return packet;
}

function unpacketize(packet) {
    const length = new Uint8Array([packet[2], packet[3]]);
    const obfuscatedData = packet.slice(4, packet.length - 4);
    if (obfuscatedData.length !== length[0] + (length[1] << 8)) {
        throw ('Packet length does not match the length field.');
    }

    return xor(obfuscatedData);
}

// Known commands:
// 0x30 - Present version information, seemingly ignored by the radio
// 0x19 - Flash block write request. Usually sent in blocks of 100 bytes. 

// Known responses:
// 0x18 - Radio is in bootloader mode and ready to flash. This packet is spammed by the radio until flashing begins. 
// 0x1a - FLash block was written successfully. This packet is sent after each 0x19 write request.

/**
 * Waits for a packet from the radio. The packet data is returned as a Uint8Array. 
 * @param {SerialPort} port - The serial port to read from.
 * @param {number} expectedData - The first byte of the expected packet. (just a byte, not uint8array)
 * @param {number} timeout - The timeout in milliseconds.
 * @returns {Promise<Uint8Array>} - A promise that resolves with the received packet or gets rejected on timeout.
 */
async function readPacket(port, expectedData, timeout = 1000) {
    // Create a reader to read data from the serial port
    const reader = port.readable.getReader();
    let buffer = new Uint8Array();
    let timeoutId; // Store the timeout ID to clear it later

    try {
        return await new Promise((resolve, reject) => {
            // Event listener to handle incoming data
            function handleData({ value, done }) {
                if (done) {
                    // If `done` is true, then the reader has been cancelled
                    reject('Reader has been cancelled.');
                    return;
                }

                // Append the new data to the buffer
                buffer = new Uint8Array([...buffer, ...value]);

                // Process packets while there's enough data in the buffer
                while (buffer.length >= 4 && buffer[0] === 0xAB && buffer[1] === 0xCD) {
                    const payloadLength = buffer[2] + (buffer[3] << 8);
                    const totalPacketLength = payloadLength + 8; // Packet length + header + footer

                    if (buffer.length >= totalPacketLength) {
                        // Extract the packet from the buffer
                        const packet = buffer.slice(0, totalPacketLength);

                        // Verify if the received data forms a valid packet
                        if (packet[payloadLength + 6] === 0xDC && packet[payloadLength + 7] === 0xBA) {
                            // Remove the processed packet from the buffer
                            buffer = buffer.slice(totalPacketLength);

                            // Continue if the packet is not the expected data
                            deobfuscatedData = unpacketize(packet);
                            if (deobfuscatedData[0] !== expectedData) {
                                console.log('Unexpected packet received:', deobfuscatedData);
                                continue;
                            }

                            // Resolve with the deobfuscated data if it matches the expected data
                            resolve(deobfuscatedData);
                            return;
                        } else {
                            // If the packet is not valid, discard the first byte and try again
                            buffer = buffer.slice(1);
                        }
                    } else {
                        // Not enough data in the buffer to form a complete packet
                        // Break the loop and wait for more data
                        break;
                    }
                }

                // Continue reading data
                reader.read().then(handleData).catch(error => {
                    console.error('Error reading data from the serial port:', error);
                    reject(error);
                    return;
                });
            }

            // Subscribe to the data event to start listening for incoming data
            reader.read().then(handleData).catch(error_1 => {
                console.error('Error reading data from the serial port:', error_1);
                reject(error_1);
                return;
            });

            // Set the timeout to reject the Promise if the packet is not received within the specified time
            timeoutId = setTimeout(() => {
                reader.cancel().then(() => {
                    reject('Timeout: Packet not received within the specified time.');
                    return;
                }).catch(error_2 => {
                    console.error('Error cancelling reader:', error_2);
                    reject(error_2);
                    return;
                });
            }, timeout);
        });
    } finally {
        // Clear the timeout when the promise is settled (resolved or rejected)
        clearTimeout(timeoutId);
        // Release the reader in the finally block to ensure it is always released
        reader.releaseLock();
    }
}


/**
 * Sends a packet to the radio.
 * @param {SerialPort} port - The serial port to write to.
 * @param {Uint8Array} data - The packet data to send.
 * @returns {Promise<void>} - A promise that resolves when the packet is sent.
 * @throws {Error} - If the packet could not be sent.
 */
async function sendPacket(port, data) {
    try {
        // create writer for port
        const writer = port.writable.getWriter();
        // prepare packet
        const packet = packetize(data);
        // send packet
        console.log('Sending packet:', packet);

        await writer.write(packet);
        // close writer
        writer.releaseLock();
    } catch (error) {
        console.error('Error sending packet:', error);
        log('Error sending packet. Aborting.');
        return Promise.reject(error);
    }
}


async function sendVersion(port) {
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
function checkVersion(dataPacket, versionFromFirmware) {
    const decoder = new TextDecoder();
    // print bootloader version as string, located at index 0x14
    log(`Bootloader version: ${decoder.decode(dataPacket.slice(0x14, 0x14 + 7))}`);

    // the radio accepts a * wildcard version, so we will do the same
    if (versionFromFirmware[0] == 0x2a) return true;

    // dataPacket is a uint8array containing the relevant byte at index 0x14
    // this byte is a 2 for the uv-k5, 3 for the k5(8)/k6, 4 for the uv-5r plus
    // versionFromFirmware is a uint8array containing the version at index 0, padded with 0x00
    return dataPacket[0x14] == versionFromFirmware[0];
}

// function to create a flash command from a block of data (max 0x100 bytes), the address and the total size of the firmware file
function generateFlashCommand(data, address, totalSize) {
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
async function flashFirmware(port, firmware) {
    // for loop to flash the firmware in 0x100 byte blocks
    // this loop is safe as long as the firmware file is smaller than 0xf000 bytes
    if (firmware.length > 0xefff) throw new Error('Last resort boundary check failed. Whoever touched the code is an idiot.');
    log('Flashing... 0%')

    for (let i = 0; i < firmware.length; i += 0x100) {
        const data = firmware.slice(i, i + 0x100);
        const command = generateFlashCommand(data, i, firmware.length);

        try {
            await sendPacket(port, command);
            await readPacket(port, 0x1a);
        } catch (e) {
            log('Flash command rejected. Aborting.');
            return Promise.reject(e);
        }

        log(`Flashing... ${((i / firmware.length) * 100).toFixed(1)}%`, true);
    }
    log('Flashing... 100%', true)
    log('Successfully flashed firmware.');
    return Promise.resolve();
}


async function startFlasher() {
    flashButton = document.getElementById('flashButton');
    flashButton.classList.add('disabled');
    log('Connecting to the serial port...');
    const port = await connect();
    if (!port) {
        log('Failed to connect to the serial port.');
        flashButton.classList.remove('disabled');
        return;
    }

    try {
        const data = await readPacket(port, 0x18);
        if (data[0] == 0x18) {
            console.log('Received 0x18 packet. Radio is ready for flashing.');
            console.log('0x18 packet data: ', data);
            log('Radio in flash mode detected.');

            const response = await sendVersion(port);
            if (checkVersion(response, rawVersion)) {
                log('Version check passed.');
            } else {
                log('WARNING: Version check failed! Please select the correct version. Aborting.');
                return;
            }
            log('Flashing firmware...');
            await flashFirmware(port, rawFirmware);

            return;
        } else {
            console.log('Received unexpected packet. Radio is not ready for flashing.');
            log('Wrong packet received, is the radio in flash mode?');
            console.log('Data: ', data);
            return;
        }
    } catch (error) {
        if (error !== 'Reader has been cancelled.') {
            console.error('Error:', error);
        } else {
            log('No data received, is the radio connected and in flash mode?');
        }
        return;

    } finally {
        port.close();
        flashButton.classList.remove('disabled');
    }
}
