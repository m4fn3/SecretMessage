# SecretMessage
A plugin of Enmity (Custom Discord Client for iOS) to send secret messages that only your friends can understand!

Currently implements XOR encryption. This can only be somewhat secure if the key length is close to the length of the message. https://stackoverflow.com/questions/1135186/whats-wrong-with-xor-encryption

## Install
https://raw.githubusercontent.com/m4fn3/SecretMessage/master/dist/SecretMessage.js

## Usage
- Set key you shared with your friends using /secret command or in plugin setting
- Enable/Disable message encryption by tapping on eye icon in chat input or in plugin setting
- Now you are sending encrypted hidden message! The content of messages encrypted will end with <key**>

## ScreenShot
![photo](https://raw.githubusercontent.com/m4fn3/SecretMessage/master/preview.jpg)
