# MQTT Bridge

Bridge your webthings to MQTT. You can then set properties, execute actions and many more things through your preferred MQTT broker. For instance, this allows you to use [node red](https://nodered.org/) for your home automation.

## Setup

Install this addon through the addon list or clone it to `~/.webthingsio/addons/` using git.

Then go to `Settings > Developer > Create local authorization`. Make sure that all devices are checked and that "monitor and control" is selected. Then click allow and copy the token from the first text field. Go to `Settings > Add-Ons > MQTT Bridge > Configure` and paste your token in the access token field, then click save.

Please also make sure that you configure the URL of your MQTT broker. 

## Use

You can send to the following topics:

| Topic | Interpretation |
| ------------- | ------------- |
| `webthings/{DEVICE_ID}/properties/{PROPERTY_NAME}/set` | Send the new value the property should be set to |
| `webthings/{DEVICE_ID}/properties/{PROPERTY_NAME}/get` | Send an empty message in order to request the value of the property |
| `webthings/{DEVICE_ID}/actions/{ACTION_NAME}/execute` | Send an empty message or the desired input in order to execute the action |

You can receive from the following topics:

| Topic | Interpretation |
| ------------- | ------------- |
| `webthings/{DEVICE_ID}/properties/{PROPERTY_NAME}` | Value of property changed to the received message |
| `webthings/{DEVICE_ID}/actions/{ACTION_NAME}` | Action triggered. If an associaed input exists, it is the received message, else an empty string |
| `webthings/{DEVICE_ID}/events/{EVENT_NAME}` | Event raised. If an associaed info exists, it is the received message, else an empty string |
| `webthings/{DEVICE_ID}/connectState` | The connect state of the device changed. The received message is the new connect state |
| `webthings/{DEVICE_ID}/connected` | The device was just connected |
| `webthings/{DEVICE_ID}/disconnected` | The device was just disconnected |
| `webthings/{DEVICE_ID}/deviceAdded` | The device was just added |
| `webthings/{DEVICE_ID}/deviceModified` | The device was just modified |
| `webthings/{DEVICE_ID}/deviceRemoved` | The device was just removed |
