import { DataArray } from "./data-array.js"

export class PlaybackManager {
    static #dataSource = new DataArray()
    static #dataSourceLength = this.#dataSource.getLength()
    static #headIndex = 0

    static #parentContainer

    static #timestampStart
    static #timestampHead
    static #timestampEnd

    static #trimBtn
    static #skipBackBtn
    static #skipForwardBtn
    static #playBtn
    static #rateSelect

    static #playInterval
    static #dataRateHz = 100 // Rate of data recorded from the arduino
    static #playIntervalDelayMs = 1000 / this.#dataRateHz

    static #headIndexUpdateCallback

    static init() {
        this.#parentContainer = document.getElementById('playback-controls')
        this.#timestampStart = document.getElementById('t-left')
        this.#timestampHead = document.getElementById('t-center')
        this.#timestampEnd = document.getElementById('t-right')
        this.#trimBtn = document.getElementById('trim-selection')
        this.#skipBackBtn = document.getElementById('skip-backward')
        this.#skipForwardBtn = document.getElementById('skip-forward')
        this.#playBtn = document.getElementById('play-button')
        this.#rateSelect = document.getElementById('playback-rate')

        this.#trimBtn.addEventListener('click', () => {
            this.#handleTrimBtnClicked()
        })
        this.#skipBackBtn.addEventListener('click', () => {
            this.#handleSkipBackBtnClicked()
        })
        this.#skipForwardBtn.addEventListener('click', () => {
            this.#handleSkipForwardBtnClicked()
        })
        this.#playBtn.addEventListener('click', () => {
            this.#handlePlayBtnClicked()
        })
        this.#rateSelect.addEventListener('change', () => {
            this.#handleRateSelectChanged()
        })
    }

    static disable() {
        this.#parentContainer.classList.add('disabled')
        clearInterval(this.#playInterval)
        // Reset everything to defaults
        this.#headIndex = 0
        this.#rateSelect.value = '1'
        this.#playIntervalDelayMs = 1000 / this.#dataRateHz
        this.#playBtn.classList.add('paused')
        this.#timestampStart.innerText = "00:00.000"
        this.#timestampEnd.innerText = "00:00.000"
        this.#timestampHead.innerText = "00:00.000"
    }

    static enable() {
        this.#parentContainer.classList.remove('disabled')
    }

    static setDataSource(srcDataArray) {
        this.#dataSource = srcDataArray
        if (!srcDataArray instanceof DataArray) {
            console.log('Only DataArrays or CircularDataArrays are accepted!')
            return
        }

        // Handle empty DataArrays
        if (srcDataArray.getLength() < 1) {
            this.#timestampStart.innerText = "00:00.000"
            this.#timestampEnd.innerText = "00:00.000"
            this.#timestampHead.innerText = "00:00.000"
            this.disable()
            return
        }

        this.#dataSourceLength = this.#dataSource.getLength()

        this.#updateTimestamps()
    }

    static setIndex(idx) {
        this.#headIndex = idx
        this.#updateTimestamps(true)
    }

    static onHeadIndexUpdate(callback) {
        this.#headIndexUpdateCallback = () => {
            callback(this.#headIndex)
        }
    }

    static #updateTimestamps(updateOnlyCurrent = false) {
        // Set timestamps
        if (updateOnlyCurrent) {
            this.#timestampHead.innerText = this.#parseMillis(this.#dataSource.millis[this.#headIndex], true)
            return
        }
        this.#timestampStart.innerText = this.#parseMillis(this.#dataSource.millis[0], true)
        this.#timestampEnd.innerText = this.#parseMillis(this.#dataSource.millis[this.#dataSource.getLength() - 1], true)
    }

    static #handleTrimBtnClicked() {
        console.log('trimBtn clicked')
        /** @note functionality is actually in visuals.js. Bad design I know */
    }

    static #handleSkipBackBtnClicked() {
        console.log('skipBackBtn clicked')
        let newIndex = this.#headIndex - 10
        if (newIndex < 0) newIndex = 0
        this.#headIndex = newIndex
        this.#headIndexUpdateCallback()
        this.#updateTimestamps(true)
    }

    static #handleSkipForwardBtnClicked() {
        console.log('skipForwardBtn clicked')
        let newIndex = this.#headIndex + 10
        if (newIndex > this.#dataSourceLength - 1) newIndex = this.#dataSourceLength - 1
        this.#headIndex = newIndex
        this.#headIndexUpdateCallback()
        this.#updateTimestamps(true)
    }

    static #handlePlayBtnClicked() {
        let isPaused = this.#playBtn.classList.contains('paused')
        if (isPaused) {
            // Playing state
            this.#playBtn.classList.remove('paused')
            console.log(`playBtn clicked, state: playing`)
        } else {
            // Paused state
            this.#playBtn.classList.add('paused')
            console.log(`playBtn clicked, state: paused`)
        }

        this.#handlePlaybackIntervalState()
    }

    static #handlePlaybackIntervalState() {
        let isPaused = this.#playBtn.classList.contains('paused')
        clearInterval(this.#playInterval)
        if (!isPaused) {
            this.#playInterval = setInterval(() => {
                this.#headIndex++
                if (this.#headIndex >= this.#dataSourceLength - 1) {
                    this.#headIndex = this.#dataSourceLength - 1
                    clearInterval(this.#playInterval)
                    this.#handlePlayBtnClicked()
                }
                this.#headIndexUpdateCallback()
                this.#updateTimestamps(true)
            }, this.#playIntervalDelayMs)
        }
    }

    static #handleRateSelectChanged() {
        this.#playIntervalDelayMs = (1000 / this.#dataRateHz) / this.#rateSelect.value
        console.log(`rateSelect changed: ${this.#rateSelect.value}, new interval: ${this.#playIntervalDelayMs}ms`)
        this.#handlePlaybackIntervalState()
    }

    static #parseMillis(millis, stringify = false) {
        let parsedTime = {
            minutes: 0,
            seconds: 0,
            millis: 0
        }

        parsedTime.seconds = Math.floor(millis / 1000)
        parsedTime.millis = millis % 1000
        parsedTime.minutes = Math.floor(parsedTime.seconds / 60)
        parsedTime.seconds = parsedTime.seconds % 60

        if (stringify) {
            let minuteStr = parsedTime.minutes.toString().padStart(2, "0")
            let secondStr = parsedTime.seconds.toString().padStart(2, "0")
            let millisStr = parsedTime.millis.toString().padStart(3, "0")
            return `${minuteStr}:${secondStr}.${millisStr}`
        } else {
            return parsedTime
        }

    }
}