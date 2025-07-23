/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';
import { UiSettingsParams } from '../types';

export const getMiscUiSettings = (): Record<string, UiSettingsParams> => {
  return {
    'truncate:maxHeight': {
      name: i18n.translate('core.ui_settings.params.maxCellHeightTitle', {
        defaultMessage: '最大表格單元格高度',
      }),
      value: 115,
      description: i18n.translate('core.ui_settings.params.maxCellHeightText', {
        defaultMessage:
          '表格中儲存格應佔用的最大高度。設定為 0 可停用截斷功能',
      }),
      schema: schema.number({ min: 0 }),
    },
    buildNum: {
      readonly: true,
      schema: schema.maybe(schema.number()),
    },
  };
};
