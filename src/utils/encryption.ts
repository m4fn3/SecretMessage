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
    return `|${e(name, key).slice(0, 3)}|`
}

function decryptMessage(text) {
    let key = get(name, "key")
    let prefix = getPrefix(key)
    if (text.startsWith(prefix)) {
        return `${e(text.slice(0, -1).replace(prefix, ""), key)} \`[secret]\`` // 末尾の|を削除してから接頭辞を削除
    } else {
        return text
    }
}

function encryptMessage(text) {
    let key = get(name, "key")
    return `${getPrefix(key)}${e(text, key)}|`
}

export {e, decryptMessage, encryptMessage}