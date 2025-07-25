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

import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiScreenReaderOnly, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { debounce } from 'lodash';
import { parse } from 'query-string';
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { ace } from '../../../../../../../opensearch_ui_shared/public';
// @ts-ignore
import { retrieveAutoCompleteInfo, clearSubscriptions } from '../../../../../lib/mappings/mappings';
import { ConsoleMenu } from '../../../../components';
import { useEditorReadContext, useServicesContext } from '../../../../contexts';
import {
  useSaveCurrentTextObject,
  useSendCurrentRequestToOpenSearch,
  useSetInputEditor,
} from '../../../../hooks';
import * as senseEditor from '../../../../models/sense_editor';
import { autoIndent, getDocumentation } from '../console_menu_actions';
import { subscribeResizeChecker } from '../subscribe_console_resize_checker';
import { applyCurrentSettings } from './apply_editor_settings';
import { registerCommands } from './keyboard_shortcuts';

const { useUIAceKeyboardMode } = ace;

export interface EditorProps {
  initialTextValue: string;
  dataSourceId?: string;
}

interface QueryParams {
  load_from: string;
}

const abs: CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  bottom: '0',
  right: '0',
};

const DEFAULT_INPUT_VALUE = `GET _search
{
  "query": {
    "match_all": {}
  }
}`;

const inputId = 'ConAppInputTextarea';

function EditorUI({ initialTextValue, dataSourceId }: EditorProps) {
  const {
    services: { history, notifications, settings: settingsService, opensearchHostService, http },
    docLinkVersion,
  } = useServicesContext();

  const { settings } = useEditorReadContext();
  const setInputEditor = useSetInputEditor();
  const sendCurrentRequestToOpenSearch = useSendCurrentRequestToOpenSearch(dataSourceId);
  const saveCurrentTextObject = useSaveCurrentTextObject();

  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<senseEditor.SenseEditor | null>(null);

  const [textArea, setTextArea] = useState<HTMLTextAreaElement | null>(null);
  useUIAceKeyboardMode(textArea);

  const openDocumentation = useCallback(async () => {
    const documentation = await getDocumentation(editorInstanceRef.current!, docLinkVersion);
    if (!documentation) {
      return;
    }
    window.open(documentation, '_blank');
  }, [docLinkVersion]);

  useEffect(() => {
    editorInstanceRef.current = senseEditor.create(editorRef.current!);
    const editor = editorInstanceRef.current;
    const textareaElement = editorRef.current!.querySelector('textarea');

    if (textareaElement) {
      textareaElement.setAttribute('id', inputId);
    }

    const readQueryParams = () => {
      const [, queryString] = (window.location.hash || '').split('?');

      return parse(queryString || '', { sort: false }) as Required<QueryParams>;
    };

    const loadBufferFromRemote = (url: string) => {
      if (/^https?:\/\//.test(url)) {
        const loadFrom: Record<string, any> = {
          url,
          // Having dataType here is required as it doesn't allow jQuery to `eval` content
          // coming from the external source thereby preventing XSS attack.
          dataType: 'text',
          osdXsrfToken: false,
        };

        if (/https?:\/\/api\.github\.com/.test(url)) {
          loadFrom.headers = { Accept: 'application/vnd.github.v3.raw' };
        }

        // Fire and forget.
        $.ajax(loadFrom).done(async (data) => {
          const coreEditor = editor.getCoreEditor();
          await editor.update(data, true);
          editor.moveToNextRequestEdge(false);
          coreEditor.clearSelection();
          editor.highlightCurrentRequestsAndUpdateActionBar();
          coreEditor.getContainer().focus();
        });
      }
    };

    // Support for loading a console snippet from a remote source, like support docs.
    const onHashChange = debounce(() => {
      const { load_from: url } = readQueryParams();
      if (!url) {
        return;
      }
      loadBufferFromRemote(url);
    }, 200);
    window.addEventListener('hashchange', onHashChange);

    const initialQueryParams = readQueryParams();

    if (initialQueryParams.load_from) {
      loadBufferFromRemote(initialQueryParams.load_from);
    } else {
      editor.update(initialTextValue || DEFAULT_INPUT_VALUE);
    }

    function setupAutosave() {
      let timer: number;
      const saveDelay = 500;

      editor.getCoreEditor().on('change', () => {
        if (timer) {
          clearTimeout(timer);
        }
        timer = window.setTimeout(saveCurrentState, saveDelay);
      });
    }

    function saveCurrentState() {
      try {
        const content = editor.getCoreEditor().getValue();
        saveCurrentTextObject(content);
      } catch (e) {
        // Ignoring saving error
      }
    }

    setInputEditor(editor);
    setTextArea(editorRef.current!.querySelector('textarea'));

    retrieveAutoCompleteInfo(
      http,
      settingsService,
      settingsService.getAutocomplete(),
      dataSourceId
    );

    const unsubscribeResizer = subscribeResizeChecker(editorRef.current!, editor);
    setupAutosave();

    return () => {
      unsubscribeResizer();
      clearSubscriptions();
      window.removeEventListener('hashchange', onHashChange);
      if (editorInstanceRef.current) {
        editorInstanceRef.current.getCoreEditor().destroy();
      }
    };
  }, [
    saveCurrentTextObject,
    initialTextValue,
    history,
    setInputEditor,
    settingsService,
    http,
    dataSourceId,
  ]);

  useEffect(() => {
    const { current: editor } = editorInstanceRef;
    applyCurrentSettings(editor!.getCoreEditor(), settings);
    // Preserve legacy focus behavior after settings have updated.
    editor!.getCoreEditor().getContainer().focus();
  }, [settings]);

  useEffect(() => {
    registerCommands({
      senseEditor: editorInstanceRef.current!,
      sendCurrentRequestToOpenSearch,
      openDocumentation,
    });
  }, [sendCurrentRequestToOpenSearch, openDocumentation]);

  const toolTipButtonDisabled = dataSourceId === undefined;
  const sendLabel = toolTipButtonDisabled
    ? i18n.translate('console.sendRequestButtonTooltip.withoutDataSourceId', {
        defaultMessage: 'Select a data source',
      })
    : i18n.translate('console.sendRequestButtonTooltip', {
        defaultMessage: 'Send request',
      });

  return (
    <div style={abs} className="conApp">
      <div className="conApp__editor">
        <ul className="conApp__autoComplete" id="autocomplete" />
        <EuiFlexGroup
          className="conApp__editorActions"
          id="ConAppEditorActions"
          gutterSize="none"
          responsive={false}
        >
          <EuiFlexItem>
            <EuiToolTip content={sendLabel}>
              <button
                onClick={sendCurrentRequestToOpenSearch}
                data-test-subj="sendRequestButton"
                aria-label={sendLabel}
                className="conApp__editorActionButton conApp__editorActionButton--success"
                disabled={toolTipButtonDisabled}
              >
                <EuiIcon type="play" />
              </button>
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem>
            <ConsoleMenu
              getCurl={() => {
                return editorInstanceRef.current!.getRequestsAsCURL(
                  opensearchHostService.getHost()
                );
              }}
              getDocumentation={() => {
                return getDocumentation(editorInstanceRef.current!, docLinkVersion);
              }}
              autoIndent={(event: any) => {
                autoIndent(editorInstanceRef.current!, event);
              }}
              addNotification={({ title }) => notifications.toasts.add({ title })}
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiScreenReaderOnly>
          <label htmlFor={inputId}>
            {i18n.translate('console.inputTextarea', {
              defaultMessage: '開發工具控制台',
            })}
          </label>
        </EuiScreenReaderOnly>
        <div
          ref={editorRef}
          id="ConAppEditor"
          className="conApp__editorContent"
          data-test-subj="request-editor"
        />
      </div>
    </div>
  );
}

export const Editor = React.memo(EditorUI);
