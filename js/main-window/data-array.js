import { CalibrationFunctions } from "./calibration-functions.js";

export class DataArray {
    // Time in milliseconds
    millis

    // Raw sensor values
    rs0; rs1; rs2; rs3; rs4

    // Calibrated sensor values
    s0; s1; s2; s3; s4

    constructor() {
        this.millis = []
        this.rs0 = []
        this.rs1 = []
        this.rs2 = []
        this.rs3 = []
        this.rs4 = []
        this.s0 = []
        this.s1 = []
        this.s2 = []
        this.s3 = []
        this.s4 = []
    }

    addFrameFromValues(millis, s0, s1, s2, s3, s4) {
        this.millis.push(millis)
        this.rs0.push(s0)
        this.rs1.push(s1)
        this.rs2.push(s2)
        this.rs3.push(s3)
        this.rs4.push(s4)

        this.s0.push(CalibrationFunctions.s0(s0))
        this.s1.push(CalibrationFunctions.s1(s1))
        this.s2.push(CalibrationFunctions.s2(s2))
        this.s3.push(CalibrationFunctions.s3(s3))
        this.s4.push(CalibrationFunctions.s4(s4))

        // this.s0.push(s0)
        // this.s1.push(s1)
        // this.s2.push(s2)
        // this.s3.push(s3)
        // this.s4.push(s4)
    }

    getLength() {
        // Length should be the same for all arrays
        return this.millis.length
    }

    slice(start, end) {
        let temp = new DataArray()
        temp.millis = this.millis.slice(start, end)
        temp.s0 = this.s0.slice(start, end)
        temp.s1 = this.s1.slice(start, end)
        temp.s2 = this.s2.slice(start, end)
        temp.s3 = this.s3.slice(start, end)
        temp.s4 = this.s4.slice(start, end)
        temp.rs0 = this.rs0.slice(start, end)
        temp.rs1 = this.rs1.slice(start, end)
        temp.rs2 = this.rs2.slice(start, end)
        temp.rs3 = this.rs3.slice(start, end)
        temp.rs4 = this.rs4.slice(start, end)
        return temp
    }
}

export class CircularDataArray extends DataArray {
    maxLength

    constructor(maxLength = 50) {
        super()
        this.maxLength = maxLength
    }

    addFrameFromValues(millis, s0, s1, s2, s3, s4) {
        super.addFrameFromValues(millis, s0, s1, s2, s3, s4)
        if (super.getLength() > this.maxLength) {
            this.millis.shift()
            this.s0.shift()
            this.s1.shift()
            this.s2.shift()
            this.s3.shift()
            this.s4.shift()
            this.rs0.shift()
            this.rs1.shift()
            this.rs2.shift()
            this.rs3.shift()
            this.rs4.shift()
        }
    }
}