function log(message) {
    const consoleArea = document.getElementById('console');

    // Append the new message to the existing content and add a newline
    consoleArea.value += message + '\n';

    // Scroll to the bottom to show the latest message
    consoleArea.scrollTop = consoleArea.scrollHeight;
}