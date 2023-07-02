export class CalibrationFunctions {
    /**
     * Calibration function for each sensor
     * @type {calibrationFunction}
     * @param {number} rawValue - The raw sensor value from the Arduino, 0 - 1023
     * @returns {number} The calibrated value in "@todo add force/pressure unit here"
     */
    static /** calibrationFunction */ s0 = rawValue => {
        let calibratedValue = rawValue
        return calibratedValue
    }

    static /** calibrationFunction */ s1 = rawValue => {
        let calibratedValue = rawValue
        return calibratedValue
    }

    static /** calibrationFunction */ s2 = rawValue => {
        let calibratedValue = rawValue
        return calibratedValue
    }

    static /** calibrationFunction */ s3 = rawValue => {
        let calibratedValue = rawValue
        return calibratedValue
    }

    static /** calibrationFunction */ s4 = rawValue => {
        let calibratedValue = rawValue
        return calibratedValue
    }

    // Resets the transform function to its default where it does nothing
    static resetCalibrationFunction() {
        this.s0 = rawValue => {
            let calibratedValue = rawValue
            return calibratedValue
        }

        this.s1 = rawValue => {
            let calibratedValue = rawValue
            return calibratedValue
        }

        this.s2 = rawValue => {
            let calibratedValue = rawValue
            return calibratedValue
        }

        this.s3 = rawValue => {
            let calibratedValue = rawValue
            return calibratedValue
        }

        this.s4 = rawValue => {
            let calibratedValue = rawValue
            return calibratedValue
        }
    }
}