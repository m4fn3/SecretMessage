import {getPlugin, Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React, Messages} from 'enmity/metro/common'
import {Pressable} from 'enmity/components'
import {bulk, filters, getByProps} from "enmity/modules"
import {findInReactTree} from "enmity/utilities"
import {getByID, getIDByName} from "enmity/api/assets"
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name} from '../manifest.json'
import Settings from "./components/Settings"
import {getStoreHandlers} from "../../hook"
import {decryptMessage, encryptMessage, getSuffix} from "./utils/encryption"
import {get, set} from "enmity/api/settings"
import {secret} from "./components/Commands"

const Patcher = create('SecretMessage')

const [
    MessageStore
] = [
    getStoreHandlers("MessageStore")
]

const [
    Keyboard,
    ChatInput,
    Assets
] = bulk(
    filters.byProps("openSystemKeyboard"),
    filters.byName("ChatInput", false),
    filters.byProps("getAssetUriForEmbed")
)

const ShowIcon = getIDByName("ic_show_password")
const HideIcon = getIDByName("ic_hide_password")

const ReactNative = getByProps("View")
const {DCDChatManager} = ReactNative.NativeModules

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
        // add commands
        this.commands = [secret]

        // initialize variables
        const metas = [["enabled", false], ["key", "default"], ["hijack_gift", true], ["shorten_text", true]]
        metas.forEach((meta) => {
            // @ts-ignore
            initVariable(...meta)
        })

        if (getPlugin("HideGiftButton")) {
            // @ts-ignore // disable HideGiftButton if enabled
            window.enmity.plugins.disablePlugin("HideGiftButton")
        }

        let giftButtonID = null
        let sendButtonId = getIDByName("ic_send")
        let orgSendButtonColor = "#5865f2"
        // Patch gift button
        Patcher.after(Pressable.type, 'render', (self, args, res) => {
            if (typeof res.props?.children[0]?.props?.source == "number") { // get by it's source id of image; label is localized and will be language specific
                let sourceId = res.props.children[0].props.source
                let buttonType = null
                if (giftButtonID && sourceId == giftButtonID) {
                    buttonType = "gift"
                } else if (sourceId == sendButtonId) {
                    buttonType = "send"
                } else if (!giftButtonID && getByID(sourceId).httpServerLocation === "/assets/modules/chat_input/native/images") {
                    giftButtonID = sourceId // this id will depend on version
                    buttonType = "gift"
                } else {
                    return
                }
                if (buttonType == "gift") {
                    res.props.children[0].props.source = get(name, "enabled") ? HideIcon : ShowIcon
                    args[0].onPress = () => {
                        // switch state
                        set(name, "enabled", !get(name, "enabled"))
                        // reload chatInput to apply changes
                        Keyboard.setText("") // for send button
                        Keyboard.openSystemKeyboard() // for visibility icon
                        Keyboard.dismissKeyboard()
                    }
                } else if (buttonType == "send") {
                    let idx = res.props?.style[0][1]?.backgroundColor ? 1 : 2 // depends on the version! 旧版 : 1が送信ボタン / 新版 : 0がマイク,1はなし,2が送信
                    let color = res.props?.style[0][idx]?.backgroundColor
                    if (color && color != "#e74c3c") orgSendButtonColor = color  // save original color as it may be theme specific; default color is #5865f2
                    res.props.style[0][idx].backgroundColor = get(name, "enabled") ? "#e74c3c" : orgSendButtonColor
                }
            }
        })

        // Patch placeholder inside ChatInput
        Patcher.after(ChatInput.default.prototype, 'render', (self, args, res) => {
            let obj = findInReactTree(res, r => r.props?.placeholder)
            if (obj) {
                obj.props.placeholder = get(name, "enabled") ? "Send *secret* message" : "Send normal message"
            }
        })

        Patcher.before(DCDChatManager, "updateRows", (_, args, __) => {
            const rows = JSON.parse(args[1])
            for (const row of rows) {
                if (row.message?.content && Array.isArray(row.message?.content)) {
                    let lastContent = row.message.content[row.message.content.length - 1]
                    if (lastContent.type === "inlineCode" && lastContent.content.startsWith("<") && lastContent.content.endsWith(">")) {
                        let key = lastContent.content.slice(1, -1)
                        row.message.content[row.message.content.length - 1] = {
                            type: 'channelMention',
                            content: [{
                                type: 'channel',
                                content: [{"type": "text", "content": key}],
                                icon: Assets.getAssetUriForEmbed(getIDByName("ic_full_server_gating_24px"))
                            }]
                        }
                    }
                }
            }
            args[1] = JSON.stringify(rows)
        })

        // Decrypt messages you received
        Patcher.before(MessageStore, "LOAD_MESSAGES_SUCCESS", (self, args, res) => {
            args[0].messages = args[0].messages.map((message) => {
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
            let key = get(name, "key")
            let suffix = getSuffix(key)
            args[2] = args[2].replace(suffix, "")  // remove <key***> from text when you edit message for better experiences
        })
    },
    onStop() {
        this.commands = []
        Patcher.unpatchAll()
    },
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(SecretMessage)
