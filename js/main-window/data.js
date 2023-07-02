/**
 * data.js
 * Deals with general data and whatnot, such as:
 * - Initing calibration functions
 * - DOM events for loading local files
 * - DOM events for recording live data
 * - DOM events for saving recordings to file
 *  and keeping related DOM elements updated in the main window
 */
import { CalibrationFunctions } from "./calibration-functions.js"
import { DataManager } from "./data-manager.js"

/**
 * Elements
 */
const loadFileBtn = document.getElementById('load-file-btn')
const loadSampleDataBtn = document.getElementById('load-sample-data-btn')
const filenameTitle = document.getElementById('filename-title')
const fileIcon = document.getElementById('file-icon')
const visualizeFileBtn = document.getElementById('visualize-file')
const recordBtn = document.getElementById('record-btn')
const saveRecordedBtn = document.getElementById('save-recorded-btn')
const clearRecordedBtn = document.getElementById('clear-recorded-btn')

/**
 * Event listeners
 */
loadFileBtn.addEventListener('click', async () => {
    let fileName = await DataManager.loadDataFromFile()
    if (fileName) {
        fileIcon.classList.add('icon-success')
        filenameTitle.innerText = fileName
        // Simulate click on visualize-file button to switch visuals
        visualizeFileBtn.click()
    }
})

loadSampleDataBtn.addEventListener('click', () => {
    DataManager.loadSampleData()
    filenameTitle.innerText = 'Sample data'
    visualizeFileBtn.click()
})

recordBtn.addEventListener('click', () => {
    if (recordBtn.classList.contains('btn-recording')) {
        recordBtn.classList.remove('btn-recording')
        recordBtn.title = 'Start recording live data'
        DataManager.stopRecording()
    } else {
        recordBtn.classList.add('btn-recording')
        recordBtn.title = 'Stop recording live data'
        DataManager.startRecording()
    }
})

clearRecordedBtn.addEventListener('click', () => {
    DataManager.clearRecording()
})

saveRecordedBtn.addEventListener('click', () => {
    DataManager.saveRecordingToFile()
})

window.addEventListener('load', () => {
    // Set calibration functions
    let testCalibration = rawValue => {
        let calibratedValue = 0.038 * rawValue - 0.2048
        if (calibratedValue < 0) calibratedValue = 0
        return calibratedValue
    }

    let pounds100 = rawValue => {
        let calibratedValue = 0.038 * (rawValue * 4) - 0.2048
        if (calibratedValue < 0) calibratedValue = 0
        return calibratedValue
    }

    CalibrationFunctions.s0 = testCalibration
    CalibrationFunctions.s1 = testCalibration
    CalibrationFunctions.s2 = pounds100
    CalibrationFunctions.s3 = testCalibration
    CalibrationFunctions.s4 = testCalibration
})