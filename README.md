# MQTT Bridge

Bridge your webthings to MQTT. You can then set properties, execute actions and many more things through your preferred MQTT broker. For instance, this allows you to use [node red](https://nodered.org/) for your home automation.

## Setup

## Use

| Intention | Command |
| ------------- | ------------- |
| Set the value of a property | Send the value to `webthings/{DEVICE_ID}/properties/{PROPERTY_NAME}/set` |
| Execute an action | Send an empty string or the desired input to `webthings/{DEVICE_ID}/actions/{ACTION_NAME}/execute` |
| Manually request a message about the value of a property (see next table) | Send an empty string to `webthings/{DEVICE_ID}/properties/{PROPERTY_NAME}/get` |

| Topic | Interpretation |
| ------------- | ------------- |
| `webthings/{DEVICE_ID}/properties/{PROPERTY_NAME}` | Value of property changed to the sent value |
| `webthings/{DEVICE_ID}/actions/{ACTION_NAME}` | Action triggered. If an associaed input exists, this one is sent, else an empty string |
| `webthings/{DEVICE_ID}/events/{EVENT_NAME}` | Event raised. If an associaed info exists, this one is sent, else an empty string |
| `webthings/{DEVICE_ID}/connectState` | The connect state of the device changed. The new connect state is sent |
| `webthings/{DEVICE_ID}/connected` | The device was just connected |
| `webthings/{DEVICE_ID}/disconnected` | The device was just disconnected |
| `webthings/{DEVICE_ID}/deviceAdded` | The device was just added |
| `webthings/{DEVICE_ID}/deviceModified` | The device was just modified |
| `webthings/{DEVICE_ID}/deviceRemoved` | The device was just removed |
