/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiSmallButton, EuiEmptyPrompt, EuiLink, EuiText } from '@elastic/eui';
import { ApplicationStart } from 'opensearch-dashboards/public';

const appName = 'Wazuh dashboard';
export const getNoItemsMessage = (
  hideWriteControls: boolean,
  createItem: () => void,
  application: ApplicationStart
) => {
  if (hideWriteControls) {
    return (
      <EuiEmptyPrompt
        iconType="dashboardApp"
        title={
          <EuiText size="s">
            <h1 id="dashboardListingHeading">
              <FormattedMessage
                id="dashboard.listing.noItemsMessage"
                defaultMessage="Looks like you don't have any dashboards."
              />
            </h1>
          </EuiText>
        }
      />
    );
  }

  return (
    <EuiEmptyPrompt
      iconType="dashboardApp"
      title={
        <EuiText size="s">
          <h1 id="dashboardListingHeading">
            <FormattedMessage
              id="dashboard.listing.createNewDashboard.title"
              defaultMessage="建立您的第一個儀表版Create your first dashboard"
            />
          </h1>
        </EuiText>
      }
      body={
        <Fragment>
          <EuiText size="s">
            <p>
              <FormattedMessage
                id="dashboard.listing.createNewDashboard.combineDataViewFromOpenSearchDashboardsAppDescription"
                defaultMessage="您可以將任何 {appName} 應用模組的資料視圖合併到一個儀表板中，並在一個地方查看所有內容。"
                values={{
                  appName,
                }}
              />
            </p>
            <p>
              <FormattedMessage
                id="dashboard.listing.createNewDashboard.newToOpenSearchDashboardsDescription"
                defaultMessage="新增到 {appName}? {sampleDataInstallLink} 進行試用."
                values={{
                  appName,
                  sampleDataInstallLink: (
                    <EuiLink onClick={() => application.navigateToApp('sample-data')}>
                      <FormattedMessage
                        id="dashboard.listing.createNewDashboard.sampleDataInstallLinkText"
                        defaultMessage="安裝一些範例數據"
                      />
                    </EuiLink>
                  ),
                }}
              />
            </p>
          </EuiText>
        </Fragment>
      }
      actions={
        <EuiSmallButton
          onClick={createItem}
          fill
          iconType="plus"
          data-test-subj="createDashboardPromptButton"
        >
          <FormattedMessage
            id="dashboard.listing.createNewDashboard.createButtonLabel"
            defaultMessage="Create new dashboard"
          />
        </EuiSmallButton>
      }
    />
  );
};
