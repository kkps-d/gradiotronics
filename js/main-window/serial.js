/**
 * serial.js
 * Deals with serial DOM events and keeping related DOM elements updated in the main window
 */
import { DataManager } from "./data-manager.js"

/**
 * Elements
 */
const connectSerialBtn = document.getElementById('connect-serial-btn')
const connectBleBtn = document.getElementById('connect-ble-btn')
const deviceStatusText = document.getElementById('device-status-text')
const deviceStatusIcon = document.getElementById('device-status-icon')
const visualizeLiveBtn = document.getElementById('visualize-live')

/**
 * Event listeners
 */

if (window.electronAPI) {
    // Detect if electronAPI is valid

    window.electronAPI.serialPortStateUpdate(serialPortStateUpdate)

    connectSerialBtn.addEventListener('click', async () => {
        window.electronAPI.openSerialSettings()
        visualizeLiveBtn.click()
    })

    window.electronAPI.onSerialData((_event, value) => {
        DataManager.addData(value)
    })

    /**
     * Functions
     */
    function serialPortStateUpdate(_event, data) {
        let state = data.state
        if (state == 'open') {
            deviceStatusText.innerText = `Connected on ${data.path}`
            deviceStatusIcon.classList.add('icon-success')
            connectBleBtn.disabled = true
        } else if (state == 'close') {
            deviceStatusText.innerText = `No device connected`
            deviceStatusIcon.classList.remove('icon-success')
            connectBleBtn.disabled = false
        }
    }
} else {
    // If electronAPI is invalid, disable serial
    connectSerialBtn.disabled = true
    connectSerialBtn.title = 'Serial is not available'
}

