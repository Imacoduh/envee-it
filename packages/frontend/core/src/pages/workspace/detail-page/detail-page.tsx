import { Scrollable } from '@affine/component';
import { PageDetailSkeleton } from '@affine/component/page-detail-skeleton';
import { useBlockSuitePageMeta } from '@affine/core/hooks/use-block-suite-page-meta';
import type { PageService } from '@blocksuite/blocks';
import {
  BookmarkService,
  customImageProxyMiddleware,
  EmbedGithubService,
  EmbedLoomService,
  EmbedYoutubeService,
  ImageService,
} from '@blocksuite/blocks';
import type { AffineEditorContainer } from '@blocksuite/presets';
import type { Page as BlockSuitePage } from '@blocksuite/store';
import {
  globalBlockSuiteSchema,
  Page,
  PageManager,
  PageRecordList,
  ServiceProviderContext,
  useLiveData,
} from '@toeverything/infra';
import { Workspace } from '@toeverything/infra';
import { useService } from '@toeverything/infra';
import { useSetAtom } from 'jotai';
import {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import type { Map as YMap } from 'yjs';

import { recentPageIdsBaseAtom } from '../../../atoms';
import { AffineErrorBoundary } from '../../../components/affine/affine-error-boundary';
import { HubIsland } from '../../../components/affine/hub-island';
import { GlobalPageHistoryModal } from '../../../components/affine/page-history-modal';
import { ImagePreviewModal } from '../../../components/image-preview';
import { PageDetailEditor } from '../../../components/page-detail-editor';
import { TrashPageFooter } from '../../../components/pure/trash-page-footer';
import { TopTip } from '../../../components/top-tip';
import { useRegisterBlocksuiteEditorCommands } from '../../../hooks/affine/use-register-blocksuite-editor-commands';
import { usePageDocumentTitle } from '../../../hooks/use-global-state';
import { useNavigateHelper } from '../../../hooks/use-navigate-helper';
import { RightSidebarViewIsland } from '../../../modules/right-sidebar';
import {
  useIsActiveView,
  ViewBodyIsland,
  ViewHeaderIsland,
} from '../../../modules/workbench';
import { performanceRenderLogger } from '../../../shared';
import { PageNotFound } from '../../404';
import * as styles from './detail-page.css';
import { DetailPageHeader } from './detail-page-header';
import { EditorSidebar, ExtensionTabs } from './editor-sidebar';

const DetailPageImpl = memo(function DetailPageImpl() {
  const page = useService(Page);
  const pageRecordList = useService(PageRecordList);
  const currentPageId = page.id;
  const { openPage, jumpToTag } = useNavigateHelper();
  const currentWorkspace = useService(Workspace);
  const blockSuiteWorkspace = currentWorkspace.blockSuiteWorkspace;

  const pageMeta = useBlockSuitePageMeta(blockSuiteWorkspace).find(
    meta => meta.id === page.id
  );

  const isInTrash = pageMeta?.trash;

  const mode = useLiveData(page.mode);
  useRegisterBlocksuiteEditorCommands();
  const title = useLiveData(page.title);
  usePageDocumentTitle(title);

  const onLoad = useCallback(
    (bsPage: BlockSuitePage, editor: AffineEditorContainer) => {
      try {
        // todo(joooye34): improve the following migration code
        const surfaceBlock = bsPage.getBlockByFlavour('affine:surface')[0];
        // hotfix for old page
        if (
          surfaceBlock &&
          (surfaceBlock.yBlock.get('prop:elements') as YMap<any>).get(
            'type'
          ) !== '$blocksuite:internal:native$'
        ) {
          globalBlockSuiteSchema.upgradePage(
            0,
            {
              'affine:surface': 3,
            },
            bsPage.spaceDoc
          );
        }
      } catch {}

      // blocksuite editor host
      const editorHost = editor.host;

      // provide image proxy endpoint to blocksuite
      editorHost.std.clipboard.use(
        customImageProxyMiddleware(runtimeConfig.imageProxyUrl)
      );
      ImageService.setImageProxyURL(runtimeConfig.imageProxyUrl);

      // provide link preview endpoint to blocksuite
      BookmarkService.setLinkPreviewEndpoint(runtimeConfig.linkPreviewUrl);
      EmbedGithubService.setLinkPreviewEndpoint(runtimeConfig.linkPreviewUrl);
      EmbedYoutubeService.setLinkPreviewEndpoint(runtimeConfig.linkPreviewUrl);
      EmbedLoomService.setLinkPreviewEndpoint(runtimeConfig.linkPreviewUrl);

      // provide page mode and updated date to blocksuite
      const pageService = editorHost.std.spec.getService(
        'affine:page'
      ) as PageService;
      pageService.getPageMode = (pageId: string) =>
        pageRecordList.record(pageId).value?.mode.value ?? 'page';
      pageService.getPageUpdatedAt = (pageId: string) => {
        const linkedPage = pageRecordList.record(pageId).value;
        if (!linkedPage) return new Date();

        const updatedDate = linkedPage.meta.value.updatedDate;
        const createDate = linkedPage.meta.value.createDate;
        return updatedDate ? new Date(updatedDate) : new Date(createDate);
      };

      page.setMode(mode);
      // fixme: it seems pageLinkClicked is not triggered sometimes?
      const dispose = editor.slots.pageLinkClicked.on(({ pageId }) => {
        return openPage(blockSuiteWorkspace.id, pageId);
      });
      const disposeTagClick = editor.slots.tagClicked.on(({ tagId }) => {
        jumpToTag(currentWorkspace.id, tagId);
      });
      return () => {
        dispose.dispose();
        disposeTagClick.dispose();
      };
    },
    [
      blockSuiteWorkspace.id,
      currentWorkspace.id,
      jumpToTag,
      mode,
      openPage,
      page,
      pageRecordList,
    ]
  );

  const isActiveView = useIsActiveView();

  return (
    <>
      <ViewHeaderIsland>
        <DetailPageHeader
          page={page.blockSuitePage}
          workspace={currentWorkspace}
        />
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div className={styles.mainContainer}>
          {/* Add a key to force rerender when page changed, to avoid error boundary persisting. */}
          <AffineErrorBoundary key={currentPageId}>
            <Scrollable.Root>
              <Scrollable.Viewport className={styles.editorContainer}>
                <TopTip pageId={currentPageId} workspace={currentWorkspace} />
                <PageDetailEditor
                  pageId={currentPageId}
                  onLoad={onLoad}
                  workspace={blockSuiteWorkspace}
                />
              </Scrollable.Viewport>
              <Scrollable.Scrollbar />
            </Scrollable.Root>
            <HubIsland />
          </AffineErrorBoundary>
          {isInTrash ? <TrashPageFooter pageId={page.id} /> : null}
        </div>
      </ViewBodyIsland>

      <RightSidebarViewIsland
        active={isActiveView}
        header={
          <ExtensionTabs
            workspace={currentWorkspace}
            page={page.blockSuitePage}
          />
        }
        body={
          <EditorSidebar
            workspace={currentWorkspace.blockSuiteWorkspace}
            page={page.blockSuitePage}
          />
        }
      />

      <ImagePreviewModal
        pageId={currentPageId}
        workspace={blockSuiteWorkspace}
      />
      <GlobalPageHistoryModal />
    </>
  );
});

export const DetailPage = ({ pageId }: { pageId: string }): ReactElement => {
  const pageRecordList = useService(PageRecordList);

  const pageListReady = useLiveData(pageRecordList.isReady);

  const pageRecords = useLiveData(pageRecordList.records);

  const pageRecord = useMemo(
    () => pageRecords.find(page => page.id === pageId),
    [pageRecords, pageId]
  );

  const pageManager = useService(PageManager);

  const [page, setPage] = useState<Page | null>(null);

  useEffect(() => {
    if (!pageRecord) {
      return;
    }
    const { page, release } = pageManager.open(pageRecord.id);
    setPage(page);
    return () => {
      release();
    };
  }, [pageManager, pageRecord]);

  const jumpOnce = useLiveData(pageRecord?.meta.map(meta => meta.jumpOnce));

  useEffect(() => {
    if (jumpOnce) {
      pageRecord?.setMeta({ jumpOnce: false });
    }
  }, [jumpOnce, pageRecord]);

  // if sync engine has been synced and the page is null, show 404 page.
  if (pageListReady && !page) {
    return <PageNotFound />;
  }

  if (!page) {
    return <PageDetailSkeleton key="current-page-is-null" />;
  }

  return (
    <ServiceProviderContext.Provider value={page.services}>
      <DetailPageImpl />
    </ServiceProviderContext.Provider>
  );
};

export const Component = () => {
  performanceRenderLogger.info('DetailPage');

  const params = useParams();
  const setRecentPageIds = useSetAtom(recentPageIdsBaseAtom);

  useEffect(() => {
    if (params.pageId) {
      const pageId = params.pageId;
      localStorage.setItem('last_page_id', pageId);

      setRecentPageIds(ids => {
        // pick 3 recent page ids
        return [...new Set([pageId, ...ids]).values()].slice(0, 3);
      });
    }
  }, [params, setRecentPageIds]);

  const pageId = params.pageId;

  return pageId ? <DetailPage pageId={pageId} /> : null;
};
