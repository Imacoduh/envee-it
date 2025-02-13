/**
 * @vitest-environment happy-dom
 */
import 'fake-indexeddb/auto';

import { configureTestingEnvironment } from '@affine/core/testing';
import { renderHook } from '@testing-library/react';
import type { Workspace } from '@toeverything/infra';
import { initEmptyPage, ServiceProviderContext } from '@toeverything/infra';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useBlockSuiteDocMeta } from '../use-block-suite-page-meta';
import { useBlockSuiteWorkspaceHelper } from '../use-block-suite-workspace-helper';

const configureTestingWorkspace = async () => {
  const { workspace } = await configureTestingEnvironment();
  const blockSuiteWorkspace = workspace.blockSuiteWorkspace;

  initEmptyPage(blockSuiteWorkspace.createDoc({ id: 'page1' }));
  initEmptyPage(blockSuiteWorkspace.createDoc({ id: 'page2' }));

  return workspace;
};

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['requestIdleCallback'] });
});

const getWrapper = (workspace: Workspace) =>
  function Provider({ children }: PropsWithChildren) {
    return (
      <ServiceProviderContext.Provider value={workspace.services}>
        {children}
      </ServiceProviderContext.Provider>
    );
  };

describe('useBlockSuiteWorkspaceHelper', () => {
  test('should create page', async () => {
    const workspace = await configureTestingWorkspace();
    const blockSuiteWorkspace = workspace.blockSuiteWorkspace;
    const Wrapper = getWrapper(workspace);

    expect(blockSuiteWorkspace.meta.docMetas.length).toBe(3);
    const helperHook = renderHook(
      () => useBlockSuiteWorkspaceHelper(blockSuiteWorkspace),
      {
        wrapper: Wrapper,
      }
    );
    const pageMetaHook = renderHook(
      () => useBlockSuiteDocMeta(blockSuiteWorkspace),
      {
        wrapper: Wrapper,
      }
    );
    await new Promise(resolve => setTimeout(resolve));
    expect(pageMetaHook.result.current.length).toBe(3);
    expect(blockSuiteWorkspace.meta.docMetas.length).toBe(3);
    const page = helperHook.result.current.createDoc('page4');
    expect(page.id).toBe('page4');
    expect(blockSuiteWorkspace.meta.docMetas.length).toBe(4);
    pageMetaHook.rerender();
    expect(pageMetaHook.result.current.length).toBe(4);
  });
});
