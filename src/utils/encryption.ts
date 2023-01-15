// @ts-ignore
import manifest, {name} from '../../manifest.json'
import {get} from "enmity/api/settings"

function e(text, key) {
    let result = ''
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
}

function getPrefix(key) {
    return `|${e("secret", key).slice(0, 3)}|` // surrounding text with | is required to avoid being message content like space unexpectedly removed by Discord
}

function getSuffix(key) {
    return `\`<${key.slice(0, 2)}${'*'.repeat(Math.max(key.length - 2, 0))}>\``
}

function decryptMessage(text) {
    let key = get(name, "key")
    let prefix = getPrefix(key)
    let suffix = getSuffix(key)
    if (text.startsWith(prefix)) {
        return `${e(text.slice(0, -1).replace(prefix, ""), key)} ${suffix}` // remove prefix and | at the end
    } else {
        return text
    }
}

function encryptMessage(text) {
    let key = get(name, "key")
    return `${getPrefix(key)}${e(text, key)}|`
}

export {e, decryptMessage, encryptMessage, getPrefix, getSuffix}