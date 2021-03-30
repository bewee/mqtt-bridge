/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import {AddonManagerProxy, Database} from 'gateway-addon';
import {Config} from './config';
import {MqttBridge} from './mqtt-bridge';

export = async function(_addonManager: AddonManagerProxy): Promise<void> {
  const id = 'mqtt-bridge';
  const db = new Database(id, '');
  await db.open();
  const config = <Config><unknown> await db.loadConfig();
  await db.close();
  new MqttBridge(config);
}
