/**
 * message-overlay-manager.js
 * Controls the display of pop up messages on the interface
 */

/**
 * Elements
 */
const messageOverlayDiv = document.getElementById('message-overlay')
const timeoutMs = 3000

/**
 * Class
 */
export class MessageOverlay {
    static success(message) {
        let elm = this.#createMessageElement(message, 'success')
        messageOverlayDiv.appendChild(elm)
    }

    static warn(message) {
        let elm = this.#createMessageElement(message, 'warn')
        messageOverlayDiv.appendChild(elm)
    }

    static error(message) {
        let elm = this.#createMessageElement(message, 'error')
        messageOverlayDiv.appendChild(elm)
    }

    static #createMessageElement(message, msgClass) {
        let elm = document.createElement('div')
        elm.classList.add('message-box')
        elm.classList.add(msgClass)
        elm.innerHTML += message
        let icon = document.createElement('i')
        icon.classList.add('bi')
        icon.classList.add('bi-x-lg')
        elm.appendChild(icon)
        let timeout = setTimeout(() => {
            elm.remove()
        }, timeoutMs)
        icon.addEventListener('click', () => {
            clearTimeout(timeout)
            elm.remove()
        })

        return elm
    }
}