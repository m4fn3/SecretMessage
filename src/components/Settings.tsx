import {FormRow, FormSwitch,FormSection, View, ScrollView, Image, Text, FormInput} from 'enmity/components'
import {SettingsStore} from 'enmity/api/settings'
import {Constants, Navigation, React, StyleSheet} from 'enmity/metro/common'
import {Linking} from "enmity/metro/common"
// @ts-ignore
import {name, version} from '../../manifest.json'
import {getIDByName} from "enmity/api/assets";
import {getByProps} from "enmity/modules";
import {reload} from "enmity/api/native";

interface SettingsProps {
    settings: SettingsStore;
}

const LockIcon = getIDByName('ic_lock')
const GiftIcon = getIDByName('ic_gift')
const ReloadIcon = getIDByName('ic_message_retry')
const GitHubIcon = getIDByName('img_account_sync_github_white')
const DiscordIcon = getIDByName('Discord')
const TwitterIcon = getIDByName('img_account_sync_twitter_white')

const Invites = getByProps('acceptInviteAndTransitionToInviteChannel')

export default ({settings}: SettingsProps) => {
    const styles = StyleSheet.createThemedStyleSheet({
        container: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center"
        },
        image: {
            width: 70,
            height: 70,
            marginTop: 20,
            marginLeft: 20
        },
        title: {
            flexDirection: "column",

        },
        name: {
            fontSize: 30,
            paddingTop: 20,
            paddingLeft: 20,
            paddingRight: 30,
            color: Constants.ThemeColorMap.HEADER_PRIMARY,
        },
        author: {
            fontSize: 15,
            paddingLeft: 50,
            color: Constants.ThemeColorMap.HEADER_SECONDARY,
        },
        info: {
            height: 45,
            paddingTop: 3,
            paddingBottom: 3,
            justifyContent: "center",
            alignItems: "center"
        },
        footer: {
            color: Constants.ThemeColorMap.HEADER_SECONDARY,
            textAlign: 'center',
            paddingTop: 10,
            paddingBottom: 20
        }
    })
    return (
        <ScrollView>
            <View style={styles.container}>
                <Image
                    source={{uri: 'https://avatars.githubusercontent.com/u/43488869'}}
                    style={styles.image}
                />
                <View style={styles.title}>
                    <Text style={styles.name}>SecretMessage</Text>
                    <Text style={styles.author}>by mafu</Text>
                </View>
            </View>
            <FormSection title="SETTING">
                <FormInput
                    title="Key"
                    placeholder="Input key you shared with your friend"
                    value={settings.get("key")}
                    onSubmitEditing={(event) => {
                        settings.set("key", event.nativeEvent.text)
                    }}
                />
                <FormRow
                    label="Enable encryption"
                    subLabel="You can also enable it by tapping on the button in chat input if you enable the option below."
                    leading={<FormRow.Icon source={LockIcon}/>}
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("enabled",false)}
                            onValueChange={(value) => {
                                settings.set("enabled", value)
                            }}
                        />
                    }
                />
                <FormRow
                    label="Hijack gift button"
                    subLabel="Hijack useless gift button and change it to useful button :p"
                    leading={<FormRow.Icon source={GiftIcon}/>}
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("hijack_gift",false)}
                            onValueChange={(value) => {
                                settings.set("hijack_gift", value)
                            }}
                        />
                    }
                />
                <FormRow
                    label="Reload Discord"
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={ReloadIcon}/>}
                    subLabel="You may need to reload Discord to apply changes to loaded messages."
                    onPress={() => {
                        reload()
                    }}
                />
            </FormSection>
            <FormSection title="INFORMATION">
                <FormRow
                    label="Follow me on Twitter"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={TwitterIcon}/>}
                    onPress={() => {
                        Linking.openURL("https://twitter.com/m4fn3")
                    }}
                />
                <FormRow
                    label="Visit my server for help"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={DiscordIcon}/>}
                    onPress={() => {
                        Invites.acceptInviteAndTransitionToInviteChannel({
                            inviteKey: 'TrCqPTCrdq',
                            context: {location: 'Invite Button Embed'},
                            callback: () => {Navigation.pop()}
                        })
                    }}
                />
                <FormRow
                    label="Check Source on GitHub"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={GitHubIcon}/>}
                    onPress={() => {
                        Linking.openURL("https://github.com/m4fn3/SecretMessage")
                    }}
                />
            </FormSection>
            <Text style={styles.footer}>
                {`v${version}`}
            </Text>
        </ScrollView>
    )
};