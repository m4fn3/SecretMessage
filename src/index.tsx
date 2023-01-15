import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React, Messages} from 'enmity/metro/common'
import {Pressable} from 'enmity/components'
import {bulk, filters} from "enmity/modules"
import {findInReactTree} from "enmity/utilities"
import {getByID, getIDByName} from "enmity/api/assets"
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name} from '../manifest.json'
import Settings from "./components/Settings"
import {getStoreHandlers} from "./utils/store"
import {decryptMessage, encryptMessage} from "./utils/encryption"
import {get, set} from "enmity/api/settings"

const Patcher = create('SecretMessage')

const [
    MessageStore
] = [
    getStoreHandlers("MessageStore")
]

const [
    Keyboard,
    ChatInput
] = bulk(
    filters.byProps("openSystemKeyboard"),
    filters.byName("ChatInput", false)
)

const ShowIcon = getIDByName("ic_show_password")
const HideIcon = getIDByName("ic_hide_password")

function initVariable(valName, defVal, force = false) {
    if (force) {
        set(name, valName, defVal)
    } else if (get(name, valName) === undefined) {
        set(name, valName, defVal)
    }
}

const SecretMessage: Plugin = {
    ...manifest,
    onStart() {
        const metas = [["enabled", false], ["key", "default"], ["hijack_gift", true]]
        metas.forEach((meta) => {
            // @ts-ignore
            initVariable(...meta)
        })

        let giftButtonID = null
        // Patch gift button
        Patcher.after(Pressable.type, 'render', (self, args, res) => {
            if (get(name, "hijack_gift") && typeof res.props?.children[0]?.props?.source == "number") { // take over Gift button
                let sourceId = res.props.children[0].props.source
                // cache id
                if (giftButtonID && sourceId !== giftButtonID){
                    return
                } else if (!giftButtonID) {
                    if (getByID(sourceId).httpServerLocation === "/assets/modules/chat_input/native/images"){
                        giftButtonID = sourceId // check location
                    } else {
                        return
                    }
                }
                res.props.children[0].props.source = get(name, "enabled") ? ShowIcon : HideIcon
                args[0].onPress = () => {
                    // switch state
                    set(name, "enabled", !get(name, "enabled"))
                    // reload chatInput to apply changes
                    Keyboard.openSystemKeyboard()
                    Keyboard.dismissKeyboard()
                }
            }
        })

        // Patch placeholder inside ChatInput
        Patcher.after(ChatInput.default.prototype, 'render', (self, args, res) => {
            let obj = findInReactTree(res, r => r.props?.placeholder)
            if (obj) {
                obj.props.placeholder = get(name, "enabled") ? "Send *secret* message" : "Send normal message" // obj.props.placeholder
            }
        })

        // Decrypt messages you received
        Patcher.before(MessageStore, "LOAD_MESSAGES_SUCCESS", (self, args, res) => {
            args[0].messages.map((message) => {
                message.content = message.content ? decryptMessage(message.content) : message.content
                return message
            })
        })
        Patcher.before(MessageStore, "MESSAGE_CREATE", (self, args, res) => {
            let text = args[0].message.content
            args[0].message.content = text ? decryptMessage(text) : text
            // console.log(`CREATE - ${text}`)
        })
        Patcher.before(MessageStore, "MESSAGE_UPDATE", (self, args, res) => {
            let text = args[0].message.content
            args[0].message.content = text ? decryptMessage(text) : text
            // console.log(`UPDATE - ${text}`)
        })

        // Encrypt messages you send
        Patcher.before(Messages, "sendMessage", (self, args, res) => {
            if (get(name, "enabled")) {
                let text = args[1].content
                args[1].content = text ? encryptMessage(text) : text
                // console.log(`sendMessage - ${text}`)
            }
        })
        Patcher.before(Messages, "editMessage", (self, args, res) => {
            if (get(name, "enabled")) {
                let text = args[2].content
                args[2].content = text ? encryptMessage(text) : text
                // console.log(`editMessage - ${text}`)
            }
        })
        Patcher.before(Messages, "startEditMessage", (self, args, res) => {
            args[2] = args[2].replace("`[secret]`", "")  // remove [secret] from text when you edit message for better experiences
        })
    },
    onStop() {
        Patcher.unpatchAll();
    },
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(SecretMessage)
