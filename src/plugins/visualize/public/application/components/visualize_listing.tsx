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

import './visualize_listing.scss';
import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { useUnmount, useMount } from 'react-use';
import { useLocation } from 'react-router-dom';

import {
  useOpenSearchDashboards,
  TableListView,
} from '../../../../opensearch_dashboards_react/public';
import { VISUALIZE_ENABLE_LABS_SETTING } from '../../../../visualizations/public';
import { VisualizeServices } from '../types';
import { VisualizeConstants } from '../visualize_constants';
import { getTableColumns, getNoItemsMessage } from '../utils';
import { getUiActions } from '../../services';
import { SAVED_OBJECT_DELETE_TRIGGER } from '../../../../saved_objects_management/public';
import { HeaderVariant } from '../../../../../core/public/index';
import { constructVisBuilderPath } from '../utils/construct_vis_builder_path';

export const VisualizeListing = () => {
  const {
    services: {
      application,
      chrome,
      history,
      savedVisualizations,
      toastNotifications,
      visualizations,
      savedObjects,
      savedObjectsPublic,
      uiSettings,
      visualizeCapabilities,
      navigation,
    },
  } = useOpenSearchDashboards<VisualizeServices>();
  const { pathname } = useLocation();
  const closeNewVisModal = useRef(() => {});
  const listingLimit = savedObjectsPublic.settings.getListingLimit();
  const showUpdatedUx = uiSettings?.get('home:useNewHomePage');
  const { HeaderControl } = navigation.ui;
  const { setAppRightControls } = application;

  useEffect(() => {
    if (pathname === '/new') {
      // In case the user navigated to the page via the /visualize/new URL we start the dialog immediately
      closeNewVisModal.current = visualizations.showNewVisModal({
        onClose: () => {
          // In case the user came via a URL to this page, change the URL to the regular landing page URL after closing the modal
          history.push(VisualizeConstants.LANDING_PAGE_PATH);
        },
      });
    } else {
      // close modal window if exists
      closeNewVisModal.current();
    }
  }, [history, pathname, visualizations]);

  useMount(() => {
    if (showUpdatedUx) {
      chrome.setBreadcrumbs([
        {
          text: i18n.translate('visualize.listingBreadcrumbsTitle', {
            defaultMessage: '視覺化(visualization)',
          }),
        },
      ]);
    } else {
      chrome.setBreadcrumbs([
        {
          text: i18n.translate('visualize.legacy.listingBreadcrumbsTitle', {
            defaultMessage: '視覺化(visualization)',
          }),
        },
      ]);
    }

    chrome.docTitle.change(
      i18n.translate('visualize.listingPageTitle', { defaultMessage: '可視化' })
    );
  });
  useUnmount(() => closeNewVisModal.current());

  const createNewVis = useCallback(() => {
    closeNewVisModal.current = visualizations.showNewVisModal();
  }, [visualizations]);

  const editItem = useCallback(
    ({ editUrl, editApp }) => {
      if (editApp) {
        application.navigateToApp(editApp, { path: editUrl });
        return;
      }
      // for visualizations the edit and view URLs are the same
      history.push(editUrl);
    },
    [application, history]
  );

  const { services: visualizeServices } = useOpenSearchDashboards<VisualizeServices>();

  // This function takes a legacy visualization item as input and constructs the appropriate path.
  // It then navigates to the VisBuilder app with the constructed path to migrate the legacy visualization.
  const visbuilderEditItem = useCallback(
    async (item) => {
      const path = await constructVisBuilderPath(item, visualizeServices);
      application.navigateToApp('vis-builder', { path });
    },
    [visualizeServices, application]
  );

  const noItemsFragment = useMemo(() => getNoItemsMessage(createNewVis), [createNewVis]);
  const tableColumns = useMemo(() => getTableColumns(application, history, uiSettings), [
    application,
    history,
    uiSettings,
  ]);

  const fetchItems = useCallback(
    (filter) => {
      const isLabsEnabled = uiSettings.get(VISUALIZE_ENABLE_LABS_SETTING);
      return savedVisualizations
        .findListItems(filter, listingLimit)
        .then(({ total, hits }: { total: number; hits: object[] }) => ({
          total,
          hits: hits.filter(
            (result: any) =>
              isLabsEnabled ||
              (result.type?.stage !== 'experimental' && result.stage !== 'experimental')
          ),
        }));
    },
    [listingLimit, savedVisualizations, uiSettings]
  );

  const deleteItems = useCallback(
    async (selectedItems: object[]) => {
      const uiActions = getUiActions();
      await Promise.all(
        selectedItems.map((item: any) =>
          savedObjects.client
            .delete(item.savedObjectType, item.id)
            .then(() => {
              /**
               * TODO: this should be automatically handled by the saved objects plugin. Tracking issue:
               * https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4499
               */
              uiActions
                .getTrigger(SAVED_OBJECT_DELETE_TRIGGER)
                .exec({ type: item.savedObjectType, savedObjectId: item.id });
            })
            .catch((error) => {
              toastNotifications.addError(error, {
                title: i18n.translate('visualize.visualizeListingDeleteErrorTitle', {
                  defaultMessage: '刪除視覺化時出錯',
                }),
              });
            })
        )
      );
    },
    [savedObjects.client, toastNotifications]
  );

  return (
    <>
      {showUpdatedUx && (
        <HeaderControl
          setMountPoint={setAppRightControls}
          controls={[
            {
              id: 'visualize.createVisualization',
              label: 'Create visualization',
              testId: 'createVisualizationButton',
              run: createNewVis,
              fill: true,
              iconType: 'plus',
              controlType: 'button',
            },
          ]}
        />
      )}
      <TableListView
        headingId="visualizeListingHeading"
        // we allow users to create visualizations even if they can't save them
        // for data exploration purposes
        createItem={createNewVis}
        findItems={fetchItems}
        deleteItems={visualizeCapabilities.delete ? deleteItems : undefined}
        editItem={visualizeCapabilities.save ? editItem : undefined}
        visbuilderEditItem={visbuilderEditItem}
        tableColumns={tableColumns}
        listingLimit={listingLimit}
        initialPageSize={savedObjectsPublic.settings.getPerPage()}
        initialFilter={''}
        noItemsFragment={noItemsFragment}
        entityName={i18n.translate('visualize.listing.table.entityName', {
          defaultMessage: '視覺化(visualization)',
        })}
        entityNamePlural={i18n.translate('visualize.listing.table.entityNamePlural', {
          defaultMessage: '視覺化(visualization)',
        })}
        tableListTitle={i18n.translate('visualize.listing.table.listTitle', {
          defaultMessage: '視覺化(visualization)',
        })}
        toastNotifications={toastNotifications}
        showUpdatedUx={showUpdatedUx}
        paddingSize={showUpdatedUx ? 'm' : 'l'}
      />
    </>
  );
};
