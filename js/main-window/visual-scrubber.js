import { DataArray } from "./data-array.js"

// Limit the number of data points on graph for performance reasons
const scrubberMaxRange = 40000

export class VisualScrubber {
    static #parentContainer
    static #disabledOverlay
    static #startInput
    static #endInput
    static #headInput
    static #rangeRegionDiv
    static #pointSpacing = 1
    static #dataSource = new DataArray()
    static #previewCanvas
    static #previewCanvasCtx
    static #previewCanvasColors = [
        '#36a2eb', '#ff6384', '#ff9f40', '#ffcd56', '#4bc0c0'
    ]

    static #valueChangedCallback

    static init(divId) {
        this.#parentContainer = document.getElementById(divId)

        this.#createRequiredElements()
        this.updatePreviewCanvas()

        this.disable()

        let resizeTimeout;

        let parentObserver = new ResizeObserver(() => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => {
                this.updatePreviewCanvas()
                console.log('resized preview')
            }, 300)
            this.#resizeRangeRegion()
            console.log('resized range region')
        })

        parentObserver.observe(this.#parentContainer)

        this.#parentContainer.addEventListener('resize', () => {
            console.log('resized')
        })

        let previousX = 0
        let rangeRegionDrag = (event) => {
            let deltaX = event.x - previousX
            if (Math.abs(deltaX) > this.#pointSpacing) {
                let increment = Math.floor(deltaX / this.#pointSpacing)
                previousX = event.x
                this.#startInput.value = parseInt(this.#startInput.value) + increment
                this.#endInput.value = parseInt(this.#endInput.value) + increment
                this.#headInput.value = parseInt(this.#headInput.value) + increment
                this.#handleStartInputChange()
                this.#handleEndInputChange()
                this.#handleHeadInputChange()
                this.#resizeRangeRegion()
                this.#valueChangedCallback()
            }
        }

        this.#rangeRegionDiv.addEventListener('mousedown', event => {
            previousX = event.x
            document.addEventListener('mousemove', rangeRegionDrag)
        })

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', rangeRegionDrag)
        })

        this.#rangeRegionDiv.addEventListener('dblclick', () => {
            this.#startInput.value = parseInt(this.#headInput.value) - (scrubberMaxRange / 2) - 1
            this.#endInput.value = parseInt(this.#headInput.value) + (scrubberMaxRange / 2) - 1
            this.#resizeRangeRegion()
            this.#valueChangedCallback()
        })

        this.#startInput.addEventListener('input', () => {
            this.#handleStartInputChange()
            this.#resizeRangeRegion()
            this.#valueChangedCallback()
        })
        this.#endInput.addEventListener('input', () => {
            this.#handleEndInputChange()
            this.#resizeRangeRegion()
            this.#valueChangedCallback()
        })
        this.#headInput.addEventListener('input', () => {
            this.#handleHeadInputChange()
            this.#resizeRangeRegion()
            this.#valueChangedCallback()
        })
    }

    static getInputValues() {
        return {
            start: parseInt(this.#startInput.value),
            end: parseInt(this.#endInput.value),
            head: parseInt(this.#headInput.value)
        }
    }

    // MUST be a DataArray!
    // Could be a CircularDataArray, but doesn't really make sense
    static setDataSource(srcDataArray) {
        if (!srcDataArray instanceof DataArray) {
            console.log('Only DataArrays are accepted!')
            return
        }

        this.#dataSource = srcDataArray

        if (this.#dataSource.getLength() < 1) {
            this.disable()
        } else {
            this.enable()
        }

        this.updatePreviewCanvas()

        // Set max of the slider elements
        this.#startInput.max = this.#dataSource.getLength()
        this.#endInput.max = this.#dataSource.getLength()
        this.#headInput.max = this.#dataSource.getLength()

        this.#startInput.value = 0
        this.#headInput.value = 0

        if (this.#dataSource.getLength() > scrubberMaxRange) {
            this.#endInput.value = scrubberMaxRange
        } else {
            this.#endInput.value = this.#dataSource.getLength()
        }

        this.#resizeRangeRegion()
    }

    static setStartValue(value) {

    }

    static setEndValue(value) {

    }

    static setHeadValue(value) {
        // Updates the head location without triggering onValueChanged
        this.#headInput.value = value
        let rangeShifted = this.#handleHeadInputChange()
        this.#resizeRangeRegion()
        return rangeShifted
    }

    static disable() {
        this.#disabledOverlay.style.display = 'flex'
    }

    static enable() {
        this.#disabledOverlay.style.display = 'none'
    }

    static onValueChanged(callback) {
        this.#valueChangedCallback = (originIsSetHead=false) => {
            callback(this.getInputValues(), originIsSetHead)
        }
    }

    static #createRequiredElements() {
        // Create the overlay that covers the scrubber when disabled
        this.#disabledOverlay = document.createElement('div')
        this.#disabledOverlay.id = 'disabled-overlay'
        this.#disabledOverlay.innerText = 'Preview and scrubber unavailable'
        this.#parentContainer.appendChild(this.#disabledOverlay)

        // Create the input for the start of the range
        this.#startInput = document.createElement('input')
        this.#startInput.id = 'start'
        this.#startInput.type = 'range'
        this.#startInput.min = 0
        this.#startInput.max = 255 // Arbitary
        this.#startInput.step = 1
        this.#startInput.value = 20 // Arbitary
        this.#parentContainer.appendChild(this.#startInput)

        // Create the input for the end of the range
        this.#endInput = document.createElement('input')
        this.#endInput.id = 'end'
        this.#endInput.type = 'range'
        this.#endInput.min = 0
        this.#endInput.max = 255 // Arbitary
        this.#endInput.step = 1
        this.#endInput.value = 60 // Arbitary
        this.#parentContainer.appendChild(this.#endInput)

        // Create the input for the head (current playback frame) of the range
        this.#headInput = document.createElement('input')
        this.#headInput.id = 'head'
        this.#headInput.type = 'range'
        this.#headInput.min = 0
        this.#headInput.max = 255 // Arbitary
        this.#headInput.step = 1
        this.#headInput.value = 40 // Arbitary
        this.#parentContainer.appendChild(this.#headInput)

        // Create the canvas for the data preview and get its context
        this.#previewCanvas = document.createElement('canvas')
        this.#previewCanvas.id = 'visual-preview'
        this.#previewCanvasCtx = this.#previewCanvas.getContext('2d')
        this.#parentContainer.appendChild(this.#previewCanvas)

        // Create the div that indicates the range and allows changing it
        this.#rangeRegionDiv = document.createElement('div')
        this.#rangeRegionDiv.id = 'range-region'
        this.#rangeRegionDiv.title = 'Drag to move, double-click to expand to max range'
        this.#parentContainer.appendChild(this.#rangeRegionDiv)
    }

    static updatePreviewCanvas() {
        // Update the preview canvas using the current data

        // Resize canvas
        this.#resizePreviewCanvas()
        // Get the dimensions of canvas
        let width = this.#previewCanvas.offsetWidth
        let height = this.#previewCanvas.offsetHeight

        for (let i = 0; i < 5; i++) {
            let currentSensorArray = this.#dataSource[`s${i}`]


            let maxValue = this.#getMax(currentSensorArray)

            this.#previewCanvasCtx.lineWidth = 1
            this.#previewCanvasCtx.beginPath()
            this.#previewCanvasCtx.moveTo(0.5, height - 0.5)
            this.#previewCanvasCtx.strokeStyle = this.#previewCanvasColors[i]

            for (let j = 0; j < this.#dataSource.getLength(); j++) {
                const point = currentSensorArray[j];
                let mappedY = this.#scale(point, 0, maxValue, 0, height)
                this.#previewCanvasCtx.lineTo(this.#pointSpacing * j, height - mappedY)
            }
            this.#previewCanvasCtx.stroke()
        }

        /** @todo continute working on this to update the scrubber, code should be in Resilio-Sync/slider-test*/
    }

    static #resizePreviewCanvas() {
        this.#previewCanvas.width = this.#previewCanvas.clientWidth
        this.#previewCanvas.height = this.#previewCanvas.clientHeight
        this.#pointSpacing = this.#previewCanvas.width / this.#dataSource.getLength()
    }

    static #handleStartInputChange() {
        let startVal = parseInt(this.#startInput.value)
        let endVal = parseInt(this.#endInput.value)
        let headVal = parseInt(this.#headInput.value)

        // console.log(`Start: ${startVal}, End: ${endVal}, Head: ${headVal}`)

        // Start value is beyond head
        if (startVal > headVal) {
            this.#headInput.value = startVal + 1
        }

        // Start value is beyond end
        if (startVal > endVal) {
            this.#endInput.value = startVal + scrubberMaxRange + 1
        }

        // Start value and end value is beyond scrubberMaxRange
        if (endVal - startVal > scrubberMaxRange) {
            this.#startInput.value = endVal - scrubberMaxRange
        }
    }

    static #handleEndInputChange() {
        let startVal = parseInt(this.#startInput.value)
        let endVal = parseInt(this.#endInput.value)
        let headVal = parseInt(this.#headInput.value)

        // console.log(`Start: ${startVal}, End: ${endVal}, Head: ${headVal}`)

        // End value is beyond head
        if (endVal < headVal) {
            this.#headInput.value = endVal - 1
        }

        // End value is beyond start
        if (endVal < startVal) {
            this.#startInput.value = endVal - scrubberMaxRange - 1
        }

        // End value and start is beyond scrubberMaxRange
        if (endVal - startVal > scrubberMaxRange) {
            this.#endInput.value = startVal + scrubberMaxRange
        }
    }

    static #handleHeadInputChange() {
        let rangeShifted = false // Whether start and end value has been changed 
        let startVal = parseInt(this.#startInput.value)
        let endVal = parseInt(this.#endInput.value)
        let headVal = parseInt(this.#headInput.value)

        // console.log(`Start: ${startVal}, End: ${endVal}, Head: ${headVal}, Diff: ${endVal - startVal}`)

        // Head value is beyond end
        if (headVal > endVal) {
            this.#endInput.value = endVal + (endVal - startVal)
            this.#startInput.value = parseInt(this.#endInput.value) - (endVal - startVal) - 1
            rangeShifted = true
        }

        // Head value is beyond start
        if (headVal < startVal) {
            this.#startInput.value = startVal - (endVal - startVal)
            this.#endInput.value = parseInt(this.#startInput.value) + (endVal - startVal) + 1
            rangeShifted = true
        }
        return rangeShifted
    }

    static #resizeRangeRegion() {
        let left = this.#scale(
            parseInt(this.#startInput.value),
            0,
            this.#dataSource.getLength(),
            0,
            this.#previewCanvas.clientWidth
        )

        let right = this.#scale(
            parseInt(this.#endInput.value),
            0,
            this.#dataSource.getLength(),
            0,
            this.#previewCanvas.clientWidth
        )

        // console.log(`left: ${left}, right: ${right}`)

        this.#rangeRegionDiv.style.left = `${left}px`
        this.#rangeRegionDiv.style.width = `${right - left}px`
    }

    static #scale(number, inMin, inMax, outMin, outMax) {
        return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    static #getMax(arr) {
        let len = arr.length;
        let max = -Infinity;

        while (len--) {
            max = arr[len] > max ? arr[len] : max;
        }
        return max;
    }
}