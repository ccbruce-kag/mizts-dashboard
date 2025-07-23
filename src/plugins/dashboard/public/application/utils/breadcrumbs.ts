/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DashboardConstants } from '../../dashboard_constants';
import { ViewMode } from '../../../../embeddable/public';

export function getLandingBreadcrumbs() {
  return [
    {
      text: i18n.translate('dashboard.dashboardAppBreadcrumbsTitle', {
        defaultMessage: 'Dashboards',
      }),
      href: `#${DashboardConstants.LANDING_PAGE_PATH}`,
    },
  ];
}

export const setBreadcrumbsForNewDashboard = (viewMode: ViewMode, isDirty: boolean) => {
  if (viewMode === ViewMode.VIEW) {
    return [
      ...getLandingBreadcrumbs(),
      {
        text: i18n.translate('dashboard.strings.newDashboardViewTitle', {
          defaultMessage: '新增儀表版',
        }),
      },
    ];
  } else {
    if (isDirty) {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.newDashboardEditTitleUnsaved', {
            defaultMessage: '編輯新儀表版 (unsaved)',
          }),
        },
      ];
    } else {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.newDashboardEditTitle', {
            defaultMessage: '編輯新儀表版',
          }),
        },
      ];
    }
  }
};

export const setBreadcrumbsForExistingDashboard = (
  title: string,
  viewMode: ViewMode,
  isDirty: boolean
) => {
  if (viewMode === ViewMode.VIEW) {
    return [
      ...getLandingBreadcrumbs(),
      {
        text: i18n.translate('dashboard.strings.existingDashboardViewTitle', {
          defaultMessage: '{title}',
          values: { title },
        }),
      },
    ];
  } else {
    if (isDirty) {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.existingDashboardEditTitleUnsaved', {
            defaultMessage: '編輯 {title} (unsaved)',
            values: { title },
          }),
        },
      ];
    } else {
      return [
        ...getLandingBreadcrumbs(),
        {
          text: i18n.translate('dashboard.strings.existingDashboardEditTitle', {
            defaultMessage: '編輯 {title}',
            values: { title },
          }),
        },
      ];
    }
  }
};
