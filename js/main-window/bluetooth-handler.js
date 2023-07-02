/**
 * bluetooth-handler.js
 * Handles the scanning and requesting of bluetooth devices, connecting and disconnecting of their gatt servers, and many more
 */

const utf8Decoder = new TextDecoder('utf-8')

export class BluetoothHandler {
    static #BLUETOOTH_SCAN_OPTIONS = {
        // acceptAllDevices: true, // Don't use a filter, it will prevent the prompt from showing up if there are no filtered devices
        filters: [
            { namePrefix: "Gradiotronics" },
            { services: [0x180c, 0x180d] },
        ],
        optionalServices: [0x180c, 0x180d] // Service to get the values from the Arduino
    }
    static #RECONNECT_TRY_COUNT = 3 // Set to 0 to not reconnect

    // Stores a BluetoothDevice from the device picker
    static #currentDevice
    static #tempDevice

    // Stores the BLE GATT Server and it's characteristics once a device has been obtained
    static #currentServer
    static #sensorDataCharacteristic
    static #rssiCharacteristic

    // Callbacks for data and connection state changes
    static #onSensorDataCallback
    static #onSensorDataCallbackWrapper
    static #onConnectionStateChangeCallback
    static #connectionState // Stores the last connection state change event so it can be manually retrieved

    // Wraps private #handleDisconnect() to allow it to run in public pickADevice()
    static #handleDisconnectWrapper

    // Stores whether disconnect is manually done by user, or is a result of lost connection
    static #manualDisconnect = false

    /** Launches the device picker by communicating with BluetoothManager on the main process,
     * then attempts to connect to it
     */
    static async pickADevice() {
        try {
            this.#tempDevice = await navigator.bluetooth.requestDevice(this.#BLUETOOTH_SCAN_OPTIONS)
        }
        catch (e) {
            console.log(e)
            return
        }

        this.#currentDevice = this.#tempDevice

        this.#handleDisconnectWrapper = () => {
            this.#handleDisconnect()
        }

        this.#onSensorDataCallbackWrapper = event => {
            if (this.#onSensorDataCallback) {
                this.#onSensorDataCallback(utf8Decoder.decode(event.target.value))
            }
        }

        this.#changeConnectionState('connecting')

        /** @todo Try to refactor the following so that all of them fits into #connectToCurrentDevice */
        if (await this.#connectToCurrentDevice()) {
            // If connection to device successful
            this.#changeConnectionState('connected')

            // Add listener to see if device is disconnected
            this.#currentDevice.addEventListener('gattserverdisconnected', this.#handleDisconnectWrapper)

            // // Add listener for sensorData notifications
            // this.#sensorDataCharacteristic.addEventListener('characteristicvaluechanged', this.#onSensorDataCallbackWrapper)

            // // Start notofications for sensorData characteristic
            // this.#sensorDataCharacteristic.startNotifications()
        } else {
            // Connection to device has failed
            this.#changeConnectionState('connection-failed')
            setTimeout(() => {
                this.#changeConnectionState('disconnected')
            }, 3000)
        }
    }

    static async disconnectFromCurrentDevice() {
        this.#manualDisconnect = true

        if (this.#currentServer) {
            this.#currentServer.disconnect()
        } else {
            this.#handleDisconnect()
        }
    }

    /** Gets the current RSSI, if it's unavailable, returns null, otherwise returns a number */
    static #previousRssiForSmoothing = 0
    static async getCurrentDeviceRssi() {
        if (this.#rssiCharacteristic) {
            let value = await this.#rssiCharacteristic.readValue();
            let valueInInt = parseInt(utf8Decoder.decode(value))
            if (valueInInt == 0) {
                return this.#previousRssiForSmoothing
            } else {
                this.#previousRssiForSmoothing = valueInInt
                return valueInInt
            }
        } else {
            return null
        }
    }

    static getCurrentConnectionState() {
        return this.#connectionState
    }

    static getDeviceName() {
        return this.#currentDevice.name
    }

    // static startSensorDataStream() {
    //     if (this.#sensorDataCharacteristic) {
    //         this.#sensorDataCharacteristic.startNotifications();
    //     }
    // }

    // static stopSensorDataStream() {
    //     if (this.#sensorDataCharacteristic) {
    //         this.#sensorDataCharacteristic.stopNotifications();
    //     }
    // }

    static onSensorData(callback) {
        this.#onSensorDataCallback = callback
    }

    static onConnectionStateChange(callback) {
        this.#onConnectionStateChangeCallback = callback
    }

    // Updates the current state of the connection in the variable and also calls onConnectionStateChangeCallback()
    /**
     * There are 6 connection states
     * - connecting
     * - connected
     * - connection-failed
     * - disconnected
     * - reconnecting
     * - reconnection-failed
     */
    static #changeConnectionState(state) {
        this.#connectionState = state; // Dont remove this semicolon, JS thinks state is a function with the inline callback on the next line
        (state => {
            this.#onConnectionStateChangeCallback(state)
        })(state)
    }

    // Attempts to connect to the current BluetoothDevice and get related services and characteristics
    static async #connectToCurrentDevice() {
        try {
            // Connect to device
            this.#currentServer = await this.#currentDevice.gatt.connect()

            // Get related services and characteristics
            let sensorDataService = await this.#currentServer.getPrimaryService(0x180c)
            let rssiService = await this.#currentServer.getPrimaryService(0x180d)

            this.#sensorDataCharacteristic = await sensorDataService.getCharacteristic(0x2a56)
            this.#rssiCharacteristic = await rssiService.getCharacteristic(0x2a56)

            // Add listener for sensorData notifications
            this.#sensorDataCharacteristic.addEventListener('characteristicvaluechanged', this.#onSensorDataCallbackWrapper)

            // Start notofications for sensorData characteristic
            this.#sensorDataCharacteristic.startNotifications()
        } catch (error) {
            // If failure at any point, failed to connect to device
            console.log('Failed connecting to device: ' + error)
            this.#clearAllDeviceVariables()
            return false
        }

        // If no failures, connection to device successful
        return true
    }

    static #handleDisconnect() {
        // Clear all device related variables whenever disconnected
        if (this.#manualDisconnect) {
            this.#changeConnectionState('disconnected')
            this.#currentDevice.removeEventListener('gattserverdisconnected', this.#handleDisconnectWrapper)
            this.#sensorDataCharacteristic.removeEventListener('characteristicvaluechanged', this.#onSensorDataCallbackWrapper)
            this.#clearAllDeviceVariables()
        } else {
            this.#clearAllDeviceVariables()
            this.#tryToReconnect()
        }

        this.#manualDisconnect = false
    }

    static async #tryToReconnect() {
        this.#changeConnectionState('reconnecting')
        for (let i = 0; i < this.#RECONNECT_TRY_COUNT; i++) {
            if (this.getCurrentConnectionState() == 'disconnected') {
                // Only time state will be 'disconnected' should be when the user triggers a manual disconnect while the program is trying to reconnect
                // If this is the case, return from function to abort reconnection
                return
            }
            console.log(`Connection lost, trying to reconnect ${this.#RECONNECT_TRY_COUNT - i} more times`)
            if (await this.#connectToCurrentDevice()) {
                this.#changeConnectionState('connected')
                return
            }
        }
        this.#changeConnectionState('reconnection-failed')
        setTimeout(() => {
            this.#changeConnectionState('disconnected')
        }, 3000)

        // Clear the 'gattserverdisconnected' event
        this.#currentDevice.removeEventListener('gattserverdisconnected', this.#handleDisconnectWrapper)
        // this.#sensorDataCharacteristic.removeEventListener('characteristicvaluechanged', this.#onSensorDataCallbackWrapper)
    }

    static #clearAllDeviceVariables() {
        this.#currentServer = null
        this.#sensorDataCharacteristic = null
        this.#rssiCharacteristic = null
    }
}