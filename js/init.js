
const useDefaultFirmwareCheckbox = document.getElementById('useDefaultFirmware');
const customFileInputDiv = document.getElementById('customFileInputDiv');
const customFileInput = document.getElementById('customFileInput');
const customFileLabel = document.getElementById('customFileLabel');
const useDefaultFirmwareSpan = document.getElementById('useDefaultFirmwareSpan');
const useDefaultFirmwareDiv = document.getElementById('useDefaultFirmwareDiv');

// Function to toggle checkbox and update UI
function toggleCheckbox() {
  useDefaultFirmwareCheckbox.checked = !useDefaultFirmwareCheckbox.checked;

  if (useDefaultFirmwareCheckbox.checked) {
    customFileInputDiv.classList.add('d-none');
    useDefaultFirmwareSpan.classList.remove('d-none');
  } else {
    customFileInputDiv.classList.remove('d-none');
    useDefaultFirmwareSpan.classList.add('d-none');
  }
}

// Click event listener for the div
useDefaultFirmwareDiv.addEventListener('click', function (event) {
  // Check if the click occurred on the checkbox or the label, and toggle accordingly
  if (
    event.target === useDefaultFirmwareCheckbox ||
    event.target === useDefaultFirmwareDiv.querySelector('.input-group-text')
  ) {
    toggleCheckbox();
  }
});

// Change event listener for the checkbox to update the UI
useDefaultFirmwareCheckbox.addEventListener('change', function () {
  toggleCheckbox();
});

// Update text to show filename after file selection
customFileInput.addEventListener('change', function () {
  // Check if a file is selected
  if (this.files.length > 0) {
    // Get the name of the selected file and update the label text
    customFileLabel.textContent = this.files[0].name;
  } else {
    // If no file is selected, reset the label text
    customFileLabel.textContent = 'Select own firmware (v26 only)';
  }
});

function patch() {
  log("");
  const file = useDefaultFirmwareCheckbox.checked
    ? fetch('fw/k5_v2.01.26_publish.bin')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => new Uint8Array(arrayBuffer))
    : new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        resolve(new Uint8Array(event.target.result));
      };
      reader.readAsArrayBuffer(customFileInput.files[0]);
    });

  file
    .then((encoded_firmware) => {
      const unpacked_firmware = unpack(encoded_firmware);

      const versionInfoString = new TextDecoder().decode(versionInfo.subarray(0, versionInfo.indexOf(0)));
      log(`Detected firmware version: ${versionInfoString}`);

      const patched_firmware = applyMods(unpacked_firmware);

      // Check size
      const current_size = patched_firmware.length;
      const max_size = 61440;
      const percentage = (current_size / max_size) * 100;
      log(`Patched firmware uses ${percentage.toFixed(2)}% of available memory (${current_size}/${max_size} bytes).`);
      if (current_size > max_size) {
        log("WARNING: Firmware is too large and WILL NOT WORK!\nTry disabling mods that take up extra memory.");
      }

      const packed_firmware = pack(patched_firmware);

      // Save encoded firmware to file
      const fwPackedBlob = new Blob([packed_firmware]);
      const fwPackedURL = URL.createObjectURL(fwPackedBlob);
      const downloadLink = document.getElementById('downloadButton');
      downloadLink.href = fwPackedURL;
      downloadLink.download = 'fw_modded.bin'; // TODO: Generate name based on mods
      downloadLink.classList.remove('disabled');
    })
    .catch((error) => {
      console.error(error);
      log('Error occurred while loading firmware.');
    });
}


modLoader(); // Initializes patcher