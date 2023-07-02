export class FootHeatmap {
    static #parentContainer
    static #heatmapContainer
    static #heatmapWrapper
    static #heatmapObject
    static #heatmapLegends
    static #footShapeMask
    static #leftAxis
    static #bottomAxis
    static #legendContainer

    static #widthInMillimeters
    static #heightInMillimeters

    static init(divId, widthMm, heightMm) {
        // Get the parent container for all the elements
        this.#parentContainer = document.getElementById(divId)

        this.#createRequiredElements()

        window.addEventListener('resize', () => {
            this.#fitHeatmapToParent()
        })

        this.#heatmapObject = h337.create({
            container: this.#heatmapWrapper,
            radius: 60,
            blur: .90,
            // backgroundColor with alpha so you can see through it
            backgroundColor: 'rgba(0, 0, 58, 0.96)',
        });

        this.setData(700, 700, 512, 700, 700)


        this.#fitHeatmapToParent()
    }

    static setData(s0, s1, s2, s3, s4) {
        let data = {
            max: 8,
            min: 0,
            data: [
                {
                    // Yellow, 2
                    x: 94,
                    y: 50,
                    value: s3
                },
                {
                    // Green, 4
                    x: 144,
                    y: 60,
                    value: s4
                },
                {
                    // Red, 1
                    x: 90,
                    y: 93,
                    value: s1
                },
                {
                    // Brown, 3
                    x: 126,
                    y: 87,
                    value: s0
                },
                {
                    // Orange, 5
                    x: 126,
                    y: 326,
                    value: s2
                }
            ]
        }

        this.#heatmapObject.setData(data)
    }

    static #createRequiredElements() {
        // Create the container for the wrapper for the heatmap. This container will be scaled to match the dimensions of the heatmap. Use this for overlays such as cutouts or axes
        this.#heatmapContainer = document.createElement('div')
        this.#heatmapContainer.id = 'heatmap-container'
        this.#parentContainer.appendChild(this.#heatmapContainer)

        // Create the container for the overlay image
        this.#footShapeMask = document.createElement('div')
        this.#footShapeMask.id = 'foot-shape-mask'
        this.#heatmapContainer.appendChild(this.#footShapeMask)

        // Create the overlay image
        let img = document.createElement('img')
        img.src = 'resources/foot-shape-mask.svg'
        this.#footShapeMask.appendChild(img)

        // Create the wrapper for the heatmap. This will be passed to h337 to create a heatmap. This wrapper will be scaled to fill the parentContainer
        this.#heatmapWrapper = document.createElement('div')
        this.#heatmapWrapper.id = 'heatmap-wrapper'
        this.#heatmapContainer.appendChild(this.#heatmapWrapper)
        

        // Create the container for the axes and legend
        // this.#heatmapLegends = document.createElement('div')
        // this.#heatmapLegends.id = 'heatmap-legends'
        // this.#heatmapContainer.appendChild(this.#heatmapLegends)

        // Create the elements that act as the axes
        // this.#leftAxis = document.createElement('div')
        // this.#bottomAxis = document.createElement('div')
        // this.#leftAxis.id = 'left-axis'
        // this.#bottomAxis.id = 'bottom-axis'
        // this.#heatmapLegends.appendChild(this.#leftAxis)
        // this.#heatmapLegends.appendChild(this.#bottomAxis)

        // Create the container for legends
        // this.#legendContainer = document.createElement('div')
        // this.#legendContainer.id = 'legend-container'
        // this.#heatmapLegends.appendChild(this.#legendContainer)
    }

    static #fitHeatmapToParent() {
        // Transform heatmapWrapper
        let widthScale = this.#parentContainer.clientWidth / this.#heatmapWrapper.clientWidth
        let heightScale = this.#parentContainer.clientHeight / this.#heatmapWrapper.clientHeight
        this.#heatmapWrapper.style.transform = `scale(${(widthScale < heightScale) ? widthScale : heightScale})`

        // Resize heatmapContainer to match canvas size for overlay
        let canvasBoundingRect = this.#heatmapWrapper.querySelector('canvas').getBoundingClientRect()
        this.#heatmapContainer.style.width = `${canvasBoundingRect.width}px`
        this.#heatmapContainer.style.height = `${canvasBoundingRect.height}px`
    }
}