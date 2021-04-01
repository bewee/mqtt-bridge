/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import {WebThingsClient, Device} from 'webthings-client';
import {connect as mqtt_connect, MqttClient} from 'mqtt';
import {Config} from './config';

export class MqttBridge {

  private webthingsClient?: WebThingsClient;

  private mqttClient?: MqttClient;

  // eslint-disable-next-line no-unused-vars
  constructor(private config: Config) {
    this.setupWebthingsClient();
    this.setupMqttClient();
  }

  async setupWebthingsClient(): Promise<void> {
    const webthingsClient = await WebThingsClient.local(
      this.config.webthingsclient_accessToken
    );

    webthingsClient.on('error', (error) => {
      console.log('WebthingsClient Error', error);
    });
    webthingsClient.on('close', () => {
      console.log('WebthingsClient lost. Reconnecting in 1 second');
      delete this.webthingsClient;
      setTimeout(this.setupWebthingsClient.bind(this), 1000);
    });
    webthingsClient.on('propertyChanged', (device_id, property_name, value) => {
      this.mqttClient?.publish(
        `webthings/${device_id}/properties/${property_name}`,
        typeof value !== 'undefined' ? JSON.stringify(value) : ''
      );
    });
    webthingsClient.on('actionTriggered', (device_id, action_name, input) => {
      this.mqttClient?.publish(
        `webthings/${device_id}/actions/${action_name}`,
        typeof input !== 'undefined' ? JSON.stringify(input) : ''
      );
    });
    webthingsClient.on('eventRaised', (device_id, event_name, info) => {
      this.mqttClient?.publish(
        `webthings/${device_id}/events/${event_name}`,
        typeof info !== 'undefined' ? JSON.stringify(info) : ''
      );
    });
    webthingsClient.on('connectState', (device_id, state) => {
      this.mqttClient?.publish(
        `webthings/${device_id}/connectState`,
        JSON.stringify(state)
      );
      if (state) {
        this.mqttClient?.publish(`webthings/${device_id}/connected`, '');
      } else {
        this.mqttClient?.publish(`webthings/${device_id}/disconnected`, '');
      }
    });
    webthingsClient.on('deviceModified', (device_id) => {
      this.mqttClient?.publish(`webthings/${device_id}/deviceModified`, '');
    });
    webthingsClient.on('deviceAdded', async (device_id: string) => {
      this.mqttClient?.publish(`webthings/${device_id}/deviceAdded`, '');
      if (this.webthingsClient) {
        const device = await this.webthingsClient.getDevice(device_id);
        await this.webthingsClient.subscribeEvents(device, device.events);
        console.log(device.id(), ':', 'Subscribed to all events');
        this.subscribeDevice(device);
      }
    });
    webthingsClient.on('deviceRemoved', async (device_id) => {
      this.mqttClient?.publish(`webthings/${device_id}/deviceRemoved`, '');
      this.mqttClient?.unsubscribe(`webthings/${device_id}/#`);
    });

    try {
      await webthingsClient.connect();
      this.webthingsClient = webthingsClient;

      setTimeout(async () => {
        if (this.webthingsClient) {
          const devices = await this.webthingsClient.getDevices();
          for (const device of devices) {
            await this.webthingsClient.subscribeEvents(device, device.events);
            console.log(device.id(), ':', 'Subscribed to all events');
            this.subscribeDevice(device);
          }
        }
      }, 100);
    } catch (e) {
      console.warn(`Failed to connect WebthingsClient. Retrying in 1 second`);
      setTimeout(this.setupWebthingsClient.bind(this), 1000);
    }
  }

  subscribeDevice(device: Device): void {
    if (this.mqttClient) {
      for (const property_name in device.properties) {
        this.mqttClient.subscribe(
          `webthings/${device.id()}/properties/${property_name}/set`,
          (err) => {
            if (err) {
              console.log(device.id(), 'property', property_name, ':',
                          'Failed to subscribe', err);
            }
          }
        );
      }
      for (const action_name in device.actions) {
        this.mqttClient.subscribe(
          `webthings/${device.id()}/actions/${action_name}/execute`,
          (err) => {
            if (err) {
              console.log(device.id(), 'action', action_name, ':',
                          'Failed to subscribe', err);
            }
          }
        );
      }
      for (const property_name in device.properties) {
        this.mqttClient.subscribe(
          `webthings/${device.id()}/properties/${property_name}/get`,
          (err) => {
            if (err) {
              console.log(device.id(), 'property', property_name, ':',
                          'Failed to subscribe', err);
            }
          }
        );
      }
      console.log(device.id(), ':', 'Subscribed to MQTT');
    }
  }

  setupMqttClient(): void {
    let clientOptions;
    if (this.config.mqttbroker_user && this.config.mqttbroker_password) {
      clientOptions = {
        username: this.config.mqttbroker_user,
        password: this.config.mqttbroker_password,
      };
    }
    const mqttClient = mqtt_connect(this.config.mqttbroker_url, clientOptions);

    mqttClient.on('connect', async () => {
      console.log('MQTT connected');
      this.mqttClient = mqttClient;
      if (this.webthingsClient) {
        for (const device of await this.webthingsClient.getDevices()) {
          this.subscribeDevice(device);
        }
      }
    });
    mqttClient.on('close', () => {
      console.warn(`MQTT lost. Retrying in 1 second`);
      delete this.mqttClient;
      setTimeout(this.setupMqttClient.bind(this), 1000);
    });
    mqttClient.on('message', this.processMessage.bind(this));
  }

  async processMessage(topic: string, message: Buffer): Promise<void> {
    const regex_property_set_result =
      /webthings\/(?<device_id>.+)\/properties\/(?<property_name>.+)\/set/
        .exec(topic);
    if (regex_property_set_result) {
      const device_id = regex_property_set_result.groups?.device_id;
      const property_name = regex_property_set_result.groups?.property_name;
      if (device_id && property_name) {
        this.notifyPropertyChange(device_id, property_name, message.toString());
      }
      return;
    }

    const regex_action_result =
      /webthings\/(?<device_id>.+)\/actions\/(?<action_name>.+)\/execute/
        .exec(topic);
    if (regex_action_result) {
      const device_id = regex_action_result.groups?.device_id;
      const action_name = regex_action_result.groups?.action_name;
      if (device_id && action_name) {
        this.notifyAction(device_id, action_name, message.toString());
      }
      return;
    }

    const regex_property_get_result =
      /webthings\/(?<device_id>.+)\/properties\/(?<property_name>.+)\/get/
        .exec(topic);
    if (regex_property_get_result) {
      const device_id = regex_property_get_result.groups?.device_id;
      const property_name = regex_property_get_result.groups?.property_name;
      if (device_id && property_name) {
        this.getProperty(device_id, property_name);
      }
    }
  }

  async getProperty(device_id: string, property_name: string): Promise<void> {
    if (this.webthingsClient) {
      const device = await this.webthingsClient.getDevice(device_id);
      const property = device.properties[property_name];
      this.mqttClient?.publish(
        `webthings/${device_id}/properties/${property_name}`,
        JSON.stringify(await property.getValue())
      );
    }
  }

  async notifyPropertyChange(
    device_id: string,
    property_name: string,
    value: string
  ): Promise<void> {
    if (this.webthingsClient) {
      const device = await this.webthingsClient.getDevice(device_id);
      const property = device.properties[property_name];
      property.setValue(JSON.parse(value));
    }
  }

  async notifyAction(
    device_id: string,
    action_name: string,
    input: string
  ): Promise<void> {
    if (this.webthingsClient) {
      const device = await this.webthingsClient.getDevice(device_id);
      const action = device.actions[action_name];
      action.execute(input === '' ? null : JSON.parse(input));
    }
  }

}
