// @ts-ignore
import manifest, {name} from '../../manifest.json'
import {get} from "enmity/api/settings"

let wrapper = ["\u05C2" ,"\u05C4","\u05C5","\u0740","\u08EA","\u08ED"]

function e(text, key) {
    let result = ''
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
}

function getWrap(key){
    return wrapper[key.length % 6]
}

function getPrefix(key) {
    return `${getWrap(key)}${e("secret", key).slice(0, 3)}${getWrap(key)}` // surrounding text with | is required to avoid message content like space being unexpectedly removed by Discord
}

function getSuffix(key) {
    return `\`<${key.slice(0, 2)}${'*'.repeat(Math.max(key.length - 2, 0))}>\``
}

function decryptMessage(text) {
    let key = get(name, "key")
    let prefix = getPrefix(key)
    let suffix = getSuffix(key)
    if (text.startsWith(prefix)) {
        let decrypted = e(decryptNewLine(text.slice(0, -1).replaceAll(prefix, "")), key)
        return `${decrypted} ${suffix}` // remove prefix and | at the end
    } else {
        return text
    }
}

function encryptMessage(text) {
    let key = get(name, "key")
    let encrypted = encryptNewLine(e(text, key))
    return `${getPrefix(key)}${encrypted}${getWrap(key)}`
}

// replace new line character with space to avoid message being long
function decryptNewLine(text) {
    return text.replaceAll("\u2004", "\r").replaceAll("\u2001", "\n").replaceAll("\u2002", "\x0B").replaceAll("\u2003", "\x0C")
}

function encryptNewLine(text) {
    return text.replaceAll("\x0B", "\u2002").replaceAll("\x0C", "\u2003").replaceAll("\r", "\u2004").replaceAll("\n", "\u2001")
}

export {e, decryptMessage, encryptMessage, getPrefix, getSuffix}