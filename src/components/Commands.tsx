import {Command, ApplicationCommandType, ApplicationCommandInputType, ApplicationCommandOptionType} from "enmity/api/commands"
import {get, set} from 'enmity/api/settings'
import {Toasts} from "enmity/metro/common"
import {getIDByName} from "enmity/api/assets"

// @ts-ignore
import {name} from '../../manifest.json'

const StarIcon = getIDByName('img_nitro_star')

const secret: Command = {
    id: "secret",
    name: "secret",
    displayName: "secret",
    description: "Set key of SecretMessage",
    displayDescription: "Set key of SecretMessage",
    type: ApplicationCommandType.Chat,
    inputType: ApplicationCommandInputType.BuiltInText,
    options: [{
        name: "key",
        displayName: "key",
        description: "new key",
        displayDescription: "new key",
        type: ApplicationCommandOptionType.String,
        required: true
    }],
    execute: async function (args, message) {
        let newKey = args[args.findIndex(i => i.name === "key")].value
        set(name, "key", newKey)
        Toasts.open({
            content: `Successfully set new key to ${newKey}`,
            source: StarIcon
        })
    }
}

export {secret}