// Webserial flasher and EEPROM programmer for Quansheng radios
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
                    console.log('Reader has been cancelled. Current Buffer:', buffer, uint8ArrayToHexString(buffer));
                    return;
                }

                // Append the new data to the buffer
                buffer = new Uint8Array([...buffer, ...value]);

                // Strip the beginning of the buffer until the first 0xAB byte
                // This is done to ensure that the buffer does not contain any incomplete packets
                while (buffer.length > 0 && buffer[0] !== 0xAB) {
                    buffer = buffer.slice(1);
                }

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
        //console.log('Sending packet:', packet);

        await writer.write(packet);
        // close writer
        writer.releaseLock();
    } catch (error) {
        console.error('Error sending packet:', error);
        log('Error sending packet. Aborting.');
        return Promise.reject(error);
    }
}
