/**
 * visuals.js
 * Deals with visuals (graphs & heatmap) and keeping related DOM elements updated in the main window
 */

import { DataArray } from "./data-array.js"
import { DataManager } from "./data-manager.js"
import { VisualManager } from "./visual-manager.js"
import { VisualScrubber } from "./visual-scrubber.js"

/**
 * Elements
 */
const visualizeSrcBtns = document.getElementsByClassName('visualize-src-btn')
const showAverageCheckbox = document.getElementById('show-average')
const trimSelectionBtn = document.getElementById('trim-selection')
// let footHeatmapContainer = document.getElementById('foot-heatmap')

/**
 * Event listeners
 */
window.addEventListener('load', () => {
    // Init
    for (let element of visualizeSrcBtns) {
        element.addEventListener('click', () => {
            console.log('New button: ' + element.id)
            for (let e of visualizeSrcBtns) {
                if (e == element) {
                    e.classList.add('visualize-src-btn-selected')
                } else {
                    e.classList.remove('visualize-src-btn-selected')
                }
            }
            /** @todo Add function to change data source in data-manager */

            switch (element.id) {
                case 'visualize-file':
                    VisualManager.setDataSource(DataManager.getData('file'))
                    break
                case 'visualize-live':
                    VisualManager.setDataSource(DataManager.getData('live'))
                    break
                case 'visualize-recorded':
                    VisualManager.setDataSource(DataManager.getData('recorded'))
                    break                    
            }
        })
    }

    Chart.defaults.color = '#FFF'
    Chart.defaults.borderColor = '#888'
    
    VisualManager.initLineChart('main-graph')
    VisualManager.initFootHeatmap('foot-heatmap')
    VisualManager.initScrubber('visual-scrubber')
    VisualManager.initPlaybackControls()
    
    // Set data source to 'live' by default
    VisualManager.setDataSource(DataManager.getData('live'))

    showAverageCheckbox.addEventListener('click', () => {
        VisualManager.setHeatmapAverageMode(showAverageCheckbox.checked)
    })
    
    DataManager.onLiveData(() => {
        VisualManager.updateVisuals(false, true)
    })

    trimSelectionBtn.addEventListener('click', () => {
        let values = VisualScrubber.getInputValues()
        // Search for active button
        let activeBtn
        for (let element of visualizeSrcBtns) {
            if (element.classList.contains('visualize-src-btn-selected')) {
                activeBtn = element
                break
            }
        }

        switch (activeBtn.id) {
            case 'visualize-file':
                DataManager.trimData('file', values.start, values.end)
                VisualManager.setDataSource(DataManager.getData('file'))
                break
            case 'visualize-live':
                DataManager.trimData('live', values.start, values.end)
                VisualManager.setDataSource(DataManager.getData('live'))
                break
            case 'visualize-recorded':
                DataManager.trimData('recorded', values.start, values.end)
                VisualManager.setDataSource(DataManager.getData('recorded'))
                break
        }
        VisualManager.updateVisuals(false, true)
    })
})