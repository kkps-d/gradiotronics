/**
 * visual-manager.js
 * Responsible for the visuals (graph & heatmap) of live data or playing back recorded data
 */

import { CircularDataArray, DataArray } from "./data-array.js"
import { FootHeatmap } from "./foot-heatmap.js"
import { VisualScrubber } from "./visual-scrubber.js"
import { PlaybackManager } from "./playback-manager.js"

export class VisualManager {
    static #dataSource = new DataArray() // The main data source
    static #visualDataSource = new DataArray() // The visual data source, may be a slice of main dataSource

    static #lineChart
    static #lineChartDiv

    static #heatmapAverageMode = false

    static #statistics = {
        fps: 0,
        displayDelay_ms: 0
    }

    static initLineChart(id) {
        this.#lineChartDiv = document.getElementById(id)
        if (!this.#lineChartDiv) {
            // Return false if element doesn't exist
            return false
        }

        let millisParser = (millis) => {
            let parsedTime = {
                minutes: 0,
                seconds: 0,
                millis: 0
            }

            parsedTime.seconds = Math.floor(millis / 1000)
            parsedTime.millis = millis % 1000
            parsedTime.minutes = Math.floor(parsedTime.seconds / 60)
            parsedTime.seconds = parsedTime.seconds % 60

            let minuteStr = parsedTime.minutes.toString().padStart(2, "0")
            let secondStr = parsedTime.seconds.toString().padStart(2, "0")
            let millisStr = parsedTime.millis.toString().padStart(3, "0")
            return `${minuteStr}:${secondStr}.${millisStr}`
        }

        // Set the style of the chart
        this.#lineChart = new Chart(
            this.#lineChartDiv,
            {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'A0, Brown'
                        },
                        {
                            label: 'A1, Red'
                        },
                        {
                            label: 'A2, Orange'
                        },
                        {
                            label: 'A3, Yellow'
                        },
                        {
                            label: 'A4, Green'
                        }
                    ]
                },
                options: {
                    animations: false,
                    elements: {
                        point: {
                            radius: 0
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index',
                    },
                    indexAxis: 'x',
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    let millis = parseInt(context[0].label)
                                    return millisParser(millis)
                                }
                            }
                        }
                    },
                    responsive: true,
                    resizeDelay: 100,
                    scales: {
                        x: {
                            display: true,
                            ticks: {
                                callback: function(value, index) {
                                    if (index % 3 === 0) {
                                        let millis = this.getLabelForValue(value)
                                        return millisParser(millis)
                                    } else {
                                        return ''
                                    }
                                }
                            },
                            title: {
                                display: true,
                                text: 'Time',
                                color: '#fff',
                            },
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Weight (lbs)',
                                color: '#fff',
                            },
                            type: 'linear',
                            min: 0,
                            max: 10,
                            ticks: {
                                stepSize: 2
                            }
                        }
                    }
                },
            }
        )
    }

    static initFootHeatmap(id) {
        FootHeatmap.init(id)
    }

    static initScrubber(id) {
        VisualScrubber.init(id)
        VisualScrubber.onValueChanged(inputValues => {
            // console.log(`Start: ${inputValues.start}, End: ${inputValues.end}, Head: ${inputValues.head}`)
            this.#visualDataSource = this.#dataSource.slice(inputValues.start, inputValues.end + 1)
            this.#updateChartDataSource()
            this.updateVisuals(true, false)
            PlaybackManager.setIndex(inputValues.head)
        })
    }

    static initPlaybackControls() {
        PlaybackManager.init()
        PlaybackManager.onHeadIndexUpdate(index => {
            let rangeShifted = VisualScrubber.setHeadValue(index)
            this.#updateHeatmap()
            if (rangeShifted) {
                let inputValues = VisualScrubber.getInputValues()
                this.#visualDataSource = this.#dataSource.slice(inputValues.start, inputValues.end + 1)
                this.#updateChartDataSource()
                this.#updateLineChart()
            }
        })
    }

    // MUST be a DataArray object!
    static setDataSource(srcDataArray) {
        if (!srcDataArray instanceof DataArray) {
            console.log('Only DataArrays or CircularDataArrays are accepted!')
            return
        }

        this.#dataSource = srcDataArray

        PlaybackManager.disable()
        if (srcDataArray instanceof CircularDataArray) {
            // Specially handle live data
            VisualScrubber.disable()
            this.#visualDataSource = srcDataArray
            this.#updateChartDataSource()
            this.updateVisuals(false, true)
        } else {
            VisualScrubber.setDataSource(srcDataArray)
            PlaybackManager.enable()
            PlaybackManager.setDataSource(srcDataArray)
            let inputValues = VisualScrubber.getInputValues()
            this.#visualDataSource = this.#dataSource.slice(inputValues.start, inputValues.end + 1)
            this.#updateChartDataSource()
            this.updateVisuals(false, false)
        }

    }

    static #secondBefore = 0 // Checked to see if a second has elapsed
    static #frameCount = 0
    static #lineChartUpdateTimeout
    static updateVisuals(delayLineChart = false, isLiveUpdate = false) {
        let start = performance.now()

        if (delayLineChart) {
            clearTimeout(this.#lineChartUpdateTimeout)
            this.#lineChartUpdateTimeout = setTimeout(() => {
                this.#updateLineChart()
            }, 200)
        } else {
            this.#updateLineChart()
        }
        this.#updateHeatmap(isLiveUpdate)

        let end = performance.now()

        let diff = end - start

        this.#statistics.displayDelay_ms = diff.toFixed(5);

        // Get framerate
        this.#frameCount++
        if (end - this.#secondBefore > 1000) {
            this.#statistics.fps = this.#frameCount
            this.#secondBefore = end
            this.#frameCount = 0
        }
    }

    static setHeatmapAverageMode(boolean) {
        this.#heatmapAverageMode = boolean
        this.#updateHeatmap(false)
    }

    // static updateVisuals() {
    //     let start = performance.now()

    //     // Turn array of dataframe objects into array of its values
    //     let millis = []
    //     let s0 = []
    //     let s1 = []
    //     let s2 = []
    //     let s3 = []
    //     let s4 = []

    //     for (let dataframe of this.#dataSource) { // Apparently faster than forEach
    //         millis.push(dataframe.millis)
    //         s0.push(dataframe.s0)
    //         s1.push(dataframe.s1)
    //         s2.push(dataframe.s2)
    //         s3.push(dataframe.s3)
    //         s4.push(dataframe.s4)
    //     }

    //     this.#updateLineChart(millis, s0, s1, s2, s3, s4)
    //     this.#updateHeatmap(millis, s0, s1, s2, s3, s4)


    //     let end = performance.now()

    //     let diff = end - start

    //     this.#statistics.displayDelay_ms = diff.toFixed(5);

    //     // Get framerate
    //     this.#frameCount++
    //     if (end - this.#secondBefore > 1000) {
    //         this.#statistics.fps = this.#frameCount
    //         this.#secondBefore = end
    //         this.#frameCount = 0
    //     }
    // }

    static #updateChartDataSource() {
        // Set the data source of the line chart
        this.#lineChart.data.labels = this.#visualDataSource.millis
        this.#lineChart.data.datasets[0].data = this.#visualDataSource.s0
        this.#lineChart.data.datasets[1].data = this.#visualDataSource.s1
        this.#lineChart.data.datasets[2].data = this.#visualDataSource.s2
        this.#lineChart.data.datasets[3].data = this.#visualDataSource.s3
        this.#lineChart.data.datasets[4].data = this.#visualDataSource.s4
    }

    static #updateLineChart() {
        this.#lineChart.update()
    }

    static #updateHeatmap(isLiveSource) {
        if (this.#heatmapAverageMode) {
            // Heatmap is showing averages
            // Get the length
            let length = this.#visualDataSource.getLength()

            let avgS0 = 0
            let avgS1 = 0
            let avgS2 = 0
            let avgS3 = 0
            let avgS4 = 0

            for (let i = 0; i < length; i++) {
                avgS0 += this.#visualDataSource.s0[i]
                avgS1 += this.#visualDataSource.s1[i]
                avgS2 += this.#visualDataSource.s2[i]
                avgS3 += this.#visualDataSource.s3[i]
                avgS4 += this.#visualDataSource.s4[i]
            }

            avgS0 /= length
            avgS1 /= length
            avgS2 /= length
            avgS3 /= length
            avgS4 /= length

            FootHeatmap.setData(avgS0, avgS1, avgS2, avgS3, avgS4)

            // console.log(`Averages: `, avgS0, avgS1, avgS2, avgS3, avgS4)
        } else {
            let index = 0
            if (isLiveSource) {
                // Use the last element as the index
                index = this.#visualDataSource.getLength() - 1
            } else {
                let inputValues = VisualScrubber.getInputValues()
                // Get the index of the selected element on the scrubber
                index = inputValues.head - inputValues.start
            }

            // Use the element at the index
            FootHeatmap.setData(
                this.#visualDataSource.s0[index],
                this.#visualDataSource.s1[index],
                this.#visualDataSource.s2[index],
                this.#visualDataSource.s3[index],
                this.#visualDataSource.s4[index]
            )
        }
    }

    /**
     * Gets the statistics of the live data source
     * - Frames per second
     * - Displaying delay
     */
    static getLiveStatistics() {
        return this.#statistics
    }
}

/**
 * Elements
 */


/**
 * Event listeners
 */

/**
 * Functions
 */