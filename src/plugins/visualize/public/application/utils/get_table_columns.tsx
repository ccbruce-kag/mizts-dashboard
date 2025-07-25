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

import React from 'react';
import { History } from 'history';
import {
  EuiBetaBadge,
  EuiSmallButton,
  EuiEmptyPrompt,
  EuiIcon,
  EuiLink,
  EuiBadge,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

import { ApplicationStart } from 'opensearch-dashboards/public';
import { VisualizationListItem } from 'src/plugins/visualizations/public';
import moment from 'moment';
import { IUiSettingsClient } from 'src/core/public';

const getBadge = (item: VisualizationListItem) => {
  if (item.stage === 'beta') {
    return (
      <EuiBetaBadge
        className="visListingTable__betaIcon"
        label="B"
        title={i18n.translate('visualize.listing.betaTitle', {
          defaultMessage: 'Beta',
        })}
        tooltipContent={i18n.translate('visualize.listing.betaTooltip', {
          defaultMessage:
            'This visualization is in beta and is subject to change. The design and code is less mature than official GA ' +
            'features and is being provided as-is with no warranties. Beta features are not subject to the support SLA of official GA ' +
            'features',
        })}
      />
    );
  } else if (item.stage === 'experimental') {
    return (
      <EuiBetaBadge
        className="visListingTable__experimentalIcon"
        label="Lab"
        size="s"
        color="subdued"
        iconType={'beaker'}
        title={i18n.translate('visualize.listing.experimentalTitle', {
          defaultMessage: 'Experimental',
        })}
        tooltipContent={i18n.translate('visualize.listing.experimentalTooltip', {
          defaultMessage:
            'This visualization might be changed or removed in a future release and is not subject to the support SLA.',
        })}
      />
    );
  }
};

const renderItemTypeIcon = (item: VisualizationListItem) => {
  let icon;
  if (item.image) {
    icon = (
      <img className="visListingTable__typeImage" aria-hidden="true" alt="" src={item.image} />
    );
  } else {
    icon = (
      <EuiIcon
        className="visListingTable__typeIcon"
        aria-hidden="true"
        type={item.icon || 'empty'}
        size="m"
      />
    );
  }

  return icon;
};

export const getTableColumns = (
  application: ApplicationStart,
  history: History,
  uiSettings: IUiSettingsClient
) => [
  {
    field: 'title',
    name: i18n.translate('visualize.listing.table.titleColumnName', {
      defaultMessage: 'Title',
    }),
    sortable: true,
    render: (field: string, { editApp, editUrl, title, error }: VisualizationListItem) =>
      // In case an error occurs i.e. the vis has wrong type, we render the vis but without the link
      !error ? (
        <EuiLink
          href={editApp ? application.getUrlForApp(editApp, { path: editUrl }) : `#${editUrl}`}
          data-test-subj={`visListingTitleLink-${title.split(' ').join('-')}`}
        >
          {field}
        </EuiLink>
      ) : (
        field
      ),
  },
  {
    field: 'typeTitle',
    name: i18n.translate('visualize.listing.table.typeColumnName', {
      defaultMessage: 'Type',
    }),
    sortable: true,
    render: (field: string, record: VisualizationListItem) =>
      !record.error ? (
        <span>
          {renderItemTypeIcon(record)}
          {record.typeTitle}
          {getBadge(record)}
        </span>
      ) : (
        <EuiBadge iconType="alert" color="warning">
          {record.error}
        </EuiBadge>
      ),
  },
  {
    field: 'description',
    name: i18n.translate('visualize.listing.table.descriptionColumnName', {
      defaultMessage: 'Description',
    }),
    sortable: true,
    render: (field: string, record: VisualizationListItem) => <span>{record.description}</span>,
  },
  {
    field: `updated_at`,
    name: i18n.translate('visualize.listing.table.columnUpdatedAtName', {
      defaultMessage: 'Last updated',
    }),
    dataType: 'date',
    sortable: true,
    description: i18n.translate('visualize.listing.table.columnUpdatedAtDescription', {
      defaultMessage: 'Last update of the saved object',
    }),
    ['data-test-subj']: 'updated-at',
    render: (updatedAt: string) =>
      updatedAt && moment(updatedAt).format(uiSettings.get('dateFormat')),
  },
];

export const getNoItemsMessage = (createItem: () => void) => (
  <EuiEmptyPrompt
    iconType="visualizeApp"
    title={
      <EuiText size="s">
        <h1 id="visualizeListingHeading">
          <FormattedMessage
            id="visualize.listing.createNew.title"
            defaultMessage="創建您的第一個視覺化"
          />
        </h1>
      </EuiText>
    }
    body={
      <EuiText size="s">
        <p>
          <FormattedMessage
            id="visualize.listing.createNew.description"
            defaultMessage="您可以根據您的數據創建不同的視覺化效果。"
          />
        </p>
      </EuiText>
    }
    actions={
      <EuiSmallButton
        onClick={createItem}
        fill
        iconType="plus"
        data-test-subj="createVisualizationPromptButton"
      >
        <FormattedMessage
          id="visualize.listing.createNew.createButtonLabel"
          defaultMessage="建立新的可視化"
        />
      </EuiSmallButton>
    }
  />
);
