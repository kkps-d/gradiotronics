/**
 * bluetooth.js
 * Deals with bluetooth DOM events and keeping related DOM elements updated in the main window
 */

import { BluetoothHandler } from "./bluetooth-handler.js"
import { DataManager } from "./data-manager.js"

/**
 * Elements
 */
const connectSerialBtn = document.getElementById('connect-serial-btn')
const connectBleBtn = document.getElementById('connect-ble-btn')
const disconnectBleBtn = document.getElementById('disconnect-ble-btn')
const deviceStatusText = document.getElementById('device-status-text')
const deviceStatusIcon = document.getElementById('device-status-icon')
const signalBars = document.getElementById('signal-bars')

/**
 * Global variables
 */
var updateSignalBarsToRssiInterval = 0

/**
 * Event listeners
 */
window.addEventListener('load', () => {
    BluetoothHandler.onSensorData(data => {
        DataManager.addData(data)
    })

    BluetoothHandler.onConnectionStateChange(state => {
        console.log('New connection state: ' + state)
        switch (state) {
            // * - connected
            // * - connection-failed
            // * - disconnected
            // * - reconnecting
            // * - reconnection-failed
            case 'connecting':
                deviceStatusIcon.classList.replace(deviceStatusIcon.classList[1], 'show-signal-bars')
                signalBars.classList.replace(signalBars.classList[1], 'signal-bars-reconnecting')
                deviceStatusText.innerText = `Connecting to ${BluetoothHandler.getDeviceName()}`
                connectSerialBtn.disabled = true

                connectBleBtn.classList.add('hidden')
                disconnectBleBtn.classList.remove('hidden')
                break
            case 'connected':
                // Change device status icon to signal bars
                deviceStatusIcon.classList.replace(deviceStatusIcon.classList[1], 'show-signal-bars')
                updateSignalBarsToRssiInterval = setInterval(updateSignalBarsToRssi, 1000)
                deviceStatusText.innerText = `${BluetoothHandler.getDeviceName()}`
                connectSerialBtn.disabled = true

                connectBleBtn.classList.add('hidden')
                disconnectBleBtn.classList.remove('hidden')
                break
            case 'connection-failed':
                deviceStatusIcon.classList.replace(deviceStatusIcon.classList[1], 'show-serial')
                signalBars.classList.replace(signalBars.classList[1], 'signal-bars-reconnecting')
                deviceStatusText.innerText = `Failed to connect to ${BluetoothHandler.getDeviceName()}`
                connectSerialBtn.disabled = true

                connectBleBtn.classList.add('hidden')
                disconnectBleBtn.classList.remove('hidden')
                break
            case 'disconnected':
                deviceStatusIcon.classList.replace(deviceStatusIcon.classList[1], 'show-serial')
                signalBars.classList.replace(signalBars.classList[1], 'signal-bars-reconnecting')
                deviceStatusText.innerText = `No device connected`
                clearInterval(updateSignalBarsToRssiInterval)
                connectSerialBtn.disabled = false

                connectBleBtn.classList.remove('hidden')
                disconnectBleBtn.classList.add('hidden')
                break
            case 'reconnecting':
                signalBars.title = `Reconnecting`
                deviceStatusIcon.classList.replace(deviceStatusIcon.classList[1], 'show-signal-bars')
                signalBars.classList.replace(signalBars.classList[1], 'signal-bars-reconnecting')
                deviceStatusText.innerText = `Reconnecting to ${BluetoothHandler.getDeviceName()}`
                clearInterval(updateSignalBarsToRssiInterval)
                connectSerialBtn.disabled = true

                connectBleBtn.classList.add('hidden')
                disconnectBleBtn.classList.remove('hidden')
                break
            case 'reconnection-failed':
                deviceStatusIcon.classList.replace(deviceStatusIcon.classList[1], 'show-serial')
                signalBars.classList.replace(signalBars.classList[1], 'signal-bars-reconnecting')
                deviceStatusText.innerText = `Cannot reconnect to ${BluetoothHandler.getDeviceName()}`
                connectSerialBtn.disabled = true

                connectBleBtn.classList.add('hidden')
                disconnectBleBtn.classList.remove('hidden')
                break
        }
    })

    connectBleBtn.addEventListener('click', async () => {
        BluetoothHandler.pickADevice()
    })

    disconnectBleBtn.addEventListener('click', async () => {
        BluetoothHandler.disconnectFromCurrentDevice()
    })
})

/**
 * Functions
 */

async function updateSignalBarsToRssi() {
    let rssi = await BluetoothHandler.getCurrentDeviceRssi()
    console.log('RSSI: ' + rssi)
    if (rssi != null) {
        signalBars.title = `${rssi} dBm`
        if (rssi > -50) {
            signalBars.classList.replace(signalBars.classList[1], 'signal-bars-3')
        } else if (rssi >= -60) {
            signalBars.classList.replace(signalBars.classList[1], 'signal-bars-2')
        } else if (rssi < -60) {
            signalBars.classList.replace(signalBars.classList[1], 'signal-bars-1')
        }
    }
}