import { displayFlex, styled } from '@affine/component';
import { Breadcrumbs } from '@affine/component';
import { IconButton } from '@affine/component';
import type { WorkspaceUnitCtorParams } from '@affine/datacenter';
import { getDataCenter, WorkspaceUnit } from '@affine/datacenter';
import { createBlocksuiteWorkspace } from '@affine/datacenter';
import { useTranslation } from '@affine/i18n';
import { assertExists } from '@blocksuite/global/utils';
import { PaperIcon, SearchIcon } from '@blocksuite/icons';
import { Workspace } from '@blocksuite/store';
import { GetStaticPaths, GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useMemo } from 'react';

import { PageLoading } from '@/components/loading';
import { WorkspaceUnitAvatar } from '@/components/workspace-avatar';
import { useLoadPublicWorkspace } from '@/hooks/use-load-public-workspace';
import { useModal } from '@/store/globalModal';

import type { NextPageWithLayout } from '../..//_app';

const DynamicBlocksuite = dynamic(() => import('@/components/editor'), {
  ssr: false,
});

export type PublicWorkspacePageProps = {
  workspaceBinary: string;
  json: Omit<
    WorkspaceUnitCtorParams,
    'blocksuiteWorkspace' | 'blobOptionsGetter'
  >;
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<
  PublicWorkspacePageProps
> = async context => {
  const { workspaceId, pageId } = context.params ?? {};
  if (typeof workspaceId !== 'string' || typeof pageId !== 'string') {
    return {
      redirect: {
        destination: '/404',
        permanent: false,
      },
      props: {},
    };
  }
  const dataCenter = await getDataCenter();

  const workspace = await dataCenter.loadPublicWorkspace(workspaceId);
  if (!workspace.blocksuiteWorkspace) {
    return {
      redirect: {
        destination: '/404',
        permanent: false,
      },
      props: {},
    };
  }
  const json = JSON.parse(JSON.stringify(workspace.toJSON()));
  const workspaceBinary = Workspace.Y.encodeStateAsUpdate(
    workspace.blocksuiteWorkspace.doc
  );
  return {
    props: {
      workspaceBinary: Buffer.from(workspaceBinary).toString('base64'),
      json,
    },
  };
};

const PageIdPage: NextPageWithLayout<PublicWorkspacePageProps> = ({
  workspaceBinary,
  json,
}) => {
  const router = useRouter();
  const { workspaceId, pageId } = router.query as Record<string, string>;
  const { triggerQuickSearchModal } = useModal();
  const workspaceUnit = useMemo(() => {
    const unit = new WorkspaceUnit(json);
    const blocksuiteWorkspace = createBlocksuiteWorkspace(json.id);
    Workspace.Y.applyUpdate(
      blocksuiteWorkspace.doc,
      Uint8Array.from(atob(workspaceBinary), c => c.charCodeAt(0))
    );
    unit.setBlocksuiteWorkspace(blocksuiteWorkspace);
    return unit;
  }, [json, workspaceBinary]);
  const { t } = useTranslation();
  const workspace = workspaceUnit.blocksuiteWorkspace;
  assertExists(workspace);

  const page = workspace.getPage(pageId);
  console.log('page', workspace, page, pageId);
  const pageTitle = page?.meta.title;
  const workspaceName = workspace?.meta.name;

  useEffect(() => {
    const pageNotFound = workspace?.meta.pageMetas.every(p => p.id !== pageId);
    if (workspace && pageNotFound) {
      router.push('/404');
    }
  }, [workspace, router, pageId]);

  return (
    <PageContainer>
      <NavContainer>
        <Breadcrumbs>
          <StyledBreadcrumbs href={`/public-workspace/${workspaceId}`}>
            <WorkspaceUnitAvatar
              size={24}
              name={workspaceName}
              workspaceUnit={workspaceUnit}
            />
            <span>{workspaceName}</span>
          </StyledBreadcrumbs>
          <StyledBreadcrumbs
            href={`/public-workspace/${workspaceId}/${pageId}`}
          >
            <PaperIcon fontSize={24} />
            <span>{pageTitle ? pageTitle : t('Untitled')}</span>
          </StyledBreadcrumbs>
        </Breadcrumbs>
        <SearchButton
          onClick={() => {
            triggerQuickSearchModal();
          }}
        >
          <SearchIcon />
        </SearchButton>
      </NavContainer>

      {workspace && page && (
        <DynamicBlocksuite
          page={page}
          workspace={workspace}
          setEditor={editor => {
            editor.readonly = true;
          }}
        />
      )}
    </PageContainer>
  );
};

PageIdPage.getLayout = function getLayout(page: ReactElement) {
  return <div>{page}</div>;
};

export default PageIdPage;

export const PageContainer = styled.div(({ theme }) => {
  return {
    height: '100vh',
    overflowY: 'auto',
    backgroundColor: theme.colors.pageBackground,
  };
});
export const NavContainer = styled.div(({ theme }) => {
  return {
    width: '100vw',
    padding: '0 12px',
    height: '60px',
    ...displayFlex('start', 'center'),
    backgroundColor: theme.colors.pageBackground,
  };
});
export const StyledBreadcrumbs = styled(NextLink)(({ theme }) => {
  return {
    flex: 1,
    ...displayFlex('center', 'center'),
    paddingLeft: '12px',
    span: {
      padding: '0 12px',
      fontSize: theme.font.base,
      lineHeight: theme.font.lineHeight,
    },
    ':hover': { color: theme.colors.primaryColor },
    transition: 'all .15s',
    ':visited': {
      color: theme.colors.popoverColor,
      ':hover': { color: theme.colors.primaryColor },
    },
  };
});
export const SearchButton = styled(IconButton)(({ theme }) => {
  return {
    color: theme.colors.iconColor,
    fontSize: '24px',
    marginLeft: 'auto',
    padding: '0 24px',
  };
});
