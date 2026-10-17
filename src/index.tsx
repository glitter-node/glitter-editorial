import React, { useEffect, useMemo, useState, type AnchorHTMLAttributes, type HTMLAttributes } from 'react';
import './styles/main.css';
import { EDITORIAL_SEARCH_PARAM, EMPTY_EDITORIAL_ARCHIVE, EMPTY_EDITORIAL_CONTINUATION, EMPTY_EDITORIAL_FEED, editorialArchiveHref, editorialDiscoveryCategories, normalizeEditorialArchiveContext, resolveEditorialArchive, resolveEditorialArticle, resolveEditorialFeed, type EditorialArticle as EditorialArticleData, type EditorialArticleStatus, type EditorialArchiveContext, type EditorialContinuation, type EditorialPagination } from './editorial-feed.js';
import { normalizeEditorialContent, sanitizeEditorialHtml, type EditorialContentMode } from './editorial-sanitizer.js';

type TextProps = HTMLAttributes<HTMLElement> & { text?: React.ReactNode };
type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & { text?: React.ReactNode };
type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const A = ({ text, children, ...props }: AnchorProps) => <a {...props}>{text ?? children}</a>;
export const Div = (props: HTMLAttributes<HTMLDivElement>) => <div {...props} />;
export const Footer = (props: HTMLAttributes<HTMLElement>) => <footer {...props} />;
export const H1 = ({ text, children, ...props }: TextProps) => <h1 {...props}>{text ?? children}</h1>;
export const H2 = ({ text, children, ...props }: TextProps) => <h2 {...props}>{text ?? children}</h2>;
export const Header = (props: HTMLAttributes<HTMLElement>) => <header {...props} />;
export const Img = (props: ImageProps) => <img {...props} />;
export const Nav = ({ ariaLabel, ...props }: HTMLAttributes<HTMLElement> & { ariaLabel?: string }) => <nav aria-label={ariaLabel} {...props} />;
export const P = ({ text, children, ...props }: TextProps) => <p {...props}>{text ?? children}</p>;
export const Section = (props: HTMLAttributes<HTMLElement>) => <section {...props} />;
export const Span = ({ text, children, ...props }: TextProps) => <span {...props}>{text ?? children}</span>;

type EditorialContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'content'> & {
  content?: string | null;
  contentMode: EditorialContentMode;
};

export const EditorialContent = ({ content, contentMode, className, ...props }: EditorialContentProps) => {
  const normalized = normalizeEditorialContent(content, contentMode);
  const sanitizedHtml = useMemo(
    () => normalized.mode === 'html' ? sanitizeEditorialHtml(normalized.content) : '',
    [normalized.content, normalized.mode],
  );
  const classes = ['editorial-content', `editorial-content--${normalized.mode}`, className].filter(Boolean).join(' ');

  if (!normalized.content.trim() || (normalized.mode === 'html' && !sanitizedHtml.trim())) return null;
  if (normalized.mode === 'text') return <div className={classes} {...props}>{normalized.content}</div>;

  return <div className={classes} {...props} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};

type EditorialPost = {
  id: number;
  href: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  bodyMode: EditorialContentMode | null;
  section: string | null;
  author: { id: string | null; name: string | null; avatar: string | null; isGuest: boolean } | null;
  createdAt: string | null;
  createdAtFormatted: string | null;
  visual: string | null;
};

type EditorialFeedState = {
  selectedBoard: { id: unknown; slug: string; name: unknown; categories: string[] } | null;
  posts: readonly EditorialPost[];
};

type EditorialArchiveProps = HTMLAttributes<HTMLElement> & {
  labelText?: string;
  titleText?: string;
  allText?: string;
  sectionsLabelText?: string;
  previousText?: string;
  nextText?: string;
  paginationLabelText?: string;
  emptyTitleText?: string;
  emptyBodyText?: string;
  searchLabelText?: string;
  searchSubmitText?: string;
  searchResultsPrefixText?: string;
  searchResultsSuffixText?: string;
  searchEmptyTitleText?: string;
  searchEmptyBodyText?: string;
  pageSize?: number;
};

type EditorialArchiveState = {
  selectedBoard: EditorialFeedState['selectedBoard'];
  posts: readonly EditorialPost[];
  categories: readonly string[];
  pagination: EditorialPagination | null;
  context: EditorialArchiveContext;
};

const currentArchiveQuery = () => typeof window === 'undefined' ? '' : window.location.search;

export const EditorialArchive = ({
  labelText,
  titleText,
  allText,
  sectionsLabelText,
  previousText,
  nextText,
  paginationLabelText,
  emptyTitleText,
  emptyBodyText,
  searchLabelText,
  searchSubmitText,
  searchResultsPrefixText,
  searchResultsSuffixText,
  searchEmptyTitleText,
  searchEmptyBodyText,
  pageSize = 10,
  className,
  ...props
}: EditorialArchiveProps) => {
  const [query, setQuery] = useState(currentArchiveQuery);
  const [archive, setArchive] = useState<EditorialArchiveState>(EMPTY_EDITORIAL_ARCHIVE);

  useEffect(() => {
    const handleHistory = () => setQuery(currentArchiveQuery());
    window.addEventListener('popstate', handleHistory);
    return () => window.removeEventListener('popstate', handleHistory);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    resolveEditorialArchive({ signal: controller.signal, pageSize, context: query }).then((result: EditorialArchiveState) => {
      if (mounted && !controller.signal.aborted) setArchive(result);
    });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [pageSize, query]);

  if (!archive.selectedBoard || (archive.posts.length === 0 && archive.context.category === null && archive.context.page === 1)) {
    return (
      <section className={['editorial-section', 'articles-empty', className].filter(Boolean).join(' ')} {...props}>
        <h2 className="section-title">{emptyTitleText}</h2>
        <p className="reading-measure">{emptyBodyText}</p>
      </section>
    );
  }

  const pagination = archive.pagination;
  const urlContext = normalizeEditorialArchiveContext(query);
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get(EDITORIAL_SEARCH_PARAM);
    const search = typeof value === 'string' ? value : null;
    window.location.assign(editorialArchiveHref({ category: archive.context.category, search, page: 1 }));
  };
  const showPagination = Boolean(pagination && (pagination.currentPage > 1 || pagination.hasMorePages || (pagination.lastPage ?? 1) > 1));
  const pageNumbers = pagination?.lastPage && pagination.lastPage <= 9
    ? Array.from({ length: pagination.lastPage }, (_, index) => index + 1)
    : [];

  return (
    <section className={['editorial-archive', className].filter(Boolean).join(' ')} {...props}>
      <div className="archive-heading">
        {labelText && <p className="section-label">{labelText}</p>}
        <h2 className="section-title">{titleText}</h2>
      </div>

      {archive.categories.length > 0 && (
        <nav className="section-filter" aria-label={sectionsLabelText}>
          <a className="section-filter-link" aria-current={archive.context.category === null ? 'page' : undefined} href={editorialArchiveHref()}>{allText}</a>
          {archive.categories.map((category) => (
            <a
              className="section-filter-link"
              aria-current={archive.context.category === category ? 'page' : undefined}
              href={editorialArchiveHref({ category, page: 1 })}
              key={category}
            >{category}</a>
          ))}
        </nav>
      )}

      <form className="archive-search" action="/articles" method="get" role="search" onSubmit={handleSearchSubmit}>
        {archive.context.category && <input type="hidden" name="category" value={archive.context.category} />}
        <label className="archive-search-label" htmlFor="editorial-archive-search">{searchLabelText}</label>
        <div className="archive-search-controls">
          <input className="archive-search-input" defaultValue={urlContext.search ?? ''} id="editorial-archive-search" key={urlContext.search ?? ''} name={EDITORIAL_SEARCH_PARAM} type="search" />
          <button className="archive-search-submit" type="submit">{searchSubmitText}</button>
        </div>
      </form>

      {archive.context.search && (
        <h3 className="archive-search-heading">
          {searchResultsPrefixText}<span>“{archive.context.search}”</span>{searchResultsSuffixText}
        </h3>
      )}

      {archive.posts.length === 0 ? (
        <div className="archive-filter-empty" aria-live="polite">
          <h2 className="archive-empty-title">{archive.context.search ? searchEmptyTitleText : emptyTitleText}</h2>
          <p className="reading-measure">{archive.context.search ? searchEmptyBodyText : emptyBodyText}</p>
        </div>
      ) : (
        <ol className="archive-list">
          {archive.posts.map((post) => (
            <li className={['archive-item', post.visual && 'archive-item--visual'].filter(Boolean).join(' ')} key={post.id}>
              <div className="archive-meta">
                {post.section && <a className="story-section-link" href={editorialArchiveHref({ category: post.section, page: 1 })}>{post.section}</a>}
                {post.createdAtFormatted && <span>{post.createdAtFormatted}</span>}
              </div>
              <div className="archive-copy">
                <h2 className="archive-title"><a className="story-title-link" href={post.href}>{post.title}</a></h2>
                {post.excerpt && <p className="archive-excerpt">{post.excerpt}</p>}
              </div>
              {post.visual && <a className="archive-visual-link" href={post.href} tabIndex={-1} aria-hidden="true"><img className="archive-visual" src={post.visual} alt="" loading="lazy" /></a>}
            </li>
          ))}
        </ol>
      )}

      {showPagination && pagination && (
        <nav className="archive-pagination" aria-label={paginationLabelText}>
          {pagination.currentPage > 1 && <a className="pagination-link pagination-direction" href={editorialArchiveHref({ ...archive.context, page: pagination.currentPage - 1 })}>{previousText}</a>}
          {pageNumbers.map((page) => (
            <a className="pagination-link" aria-current={page === pagination.currentPage ? 'page' : undefined} href={editorialArchiveHref({ ...archive.context, page })} key={page}>{page}</a>
          ))}
          {pagination.hasMorePages && <a className="pagination-link pagination-direction" href={editorialArchiveHref({ ...archive.context, page: pagination.currentPage + 1 })}>{nextText}</a>}
        </nav>
      )}
    </section>
  );
};

type EditorialFeedProps = HTMLAttributes<HTMLElement> & {
  labelText?: string;
  titleText?: string;
  featuredLabelText?: string;
  readText?: string;
  allStoriesText?: string;
  emptyTitleText?: string;
  emptyBodyText?: string;
  sectionDiscoveryLabelText?: string;
  sectionDiscoveryTitleText?: string;
  sectionDiscoveryNavLabelText?: string;
  pageSize?: number;
  variant?: 'home' | 'articles';
};

export const EditorialFeed = ({
  labelText,
  titleText,
  featuredLabelText,
  readText,
  allStoriesText,
  emptyTitleText,
  emptyBodyText,
  sectionDiscoveryLabelText,
  sectionDiscoveryTitleText,
  sectionDiscoveryNavLabelText,
  pageSize = 5,
  variant = 'home',
  className,
  ...props
}: EditorialFeedProps) => {
  const [feed, setFeed] = useState<EditorialFeedState>(EMPTY_EDITORIAL_FEED);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    resolveEditorialFeed({ signal: controller.signal, pageSize }).then((result: EditorialFeedState) => {
      if (mounted && !controller.signal.aborted) setFeed(result);
    });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [pageSize]);

  if (feed.posts.length === 0) {
    return (
      <section className={['editorial-section', 'first-edition', variant === 'home' && 'home-publication', variant === 'articles' && 'articles-empty', className].filter(Boolean).join(' ')} {...props}>
        <h2 className="section-title">{emptyTitleText}</h2>
        <p className="reading-measure">{emptyBodyText}</p>
      </section>
    );
  }

  if (variant === 'home') {
    const [leadStory, ...latestStories] = feed.posts;
    const discoveryCategories = editorialDiscoveryCategories(feed.selectedBoard, feed.posts);

    return (
      <section className={['home-publication', className].filter(Boolean).join(' ')} {...props}>
        <article className="lead-story">
          <p className="section-label">{featuredLabelText}</p>
          {(leadStory.section || leadStory.createdAtFormatted) && (
            <p className="lead-story-meta">
              {leadStory.section && <a className="story-section-link" href={editorialArchiveHref({ category: leadStory.section, page: 1 })}>{leadStory.section}</a>}
              {leadStory.createdAtFormatted && <span>{leadStory.createdAtFormatted}</span>}
            </p>
          )}
          <h2 className="lead-story-title">
            <a className="story-title-link" href={leadStory.href}>{leadStory.title}</a>
          </h2>
          {leadStory.excerpt && <p className="lead-story-excerpt">{leadStory.excerpt}</p>}
          <a className="text-action" href={leadStory.href}>{readText}</a>
          {leadStory.visual && (
            <a className="lead-story-visual-link" href={leadStory.href} tabIndex={-1} aria-hidden="true">
              <img className="lead-story-visual" src={leadStory.visual} alt="" loading="lazy" />
            </a>
          )}
        </article>

        {latestStories.length > 0 && (
          <div className="latest-stories">
            <div className="section-heading-row">
              <div>
                {labelText && <p className="section-label">{labelText}</p>}
                <h2 className="latest-stories-title">{titleText}</h2>
              </div>
              <a className="text-action all-stories-link" href="/articles">{allStoriesText}</a>
            </div>
            <ol className={`story-grid story-grid--${latestStories.length >= 3 ? 'many' : latestStories.length}`}>
              {latestStories.map((post) => (
                <li className="story-grid-item" key={post.id}>
                  <div className="story-meta">
                    {post.section && <a className="story-section-link" href={editorialArchiveHref({ category: post.section, page: 1 })}>{post.section}</a>}
                    {post.createdAtFormatted && <span>{post.createdAtFormatted}</span>}
                  </div>
                  {post.visual && (
                    <a className="story-grid-visual-link" href={post.href} tabIndex={-1} aria-hidden="true">
                      <img className="story-grid-visual" src={post.visual} alt="" loading="lazy" />
                    </a>
                  )}
                  <h2 className="story-grid-title"><a className="story-title-link" href={post.href}>{post.title}</a></h2>
                  {post.excerpt && <p className="story-excerpt">{post.excerpt}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}

        {discoveryCategories.length > 0 && (
          <section className="section-discovery">
            {sectionDiscoveryLabelText && <p className="section-label">{sectionDiscoveryLabelText}</p>}
            <h2 className="section-discovery-title">{sectionDiscoveryTitleText}</h2>
            <nav className="section-discovery-nav" aria-label={sectionDiscoveryNavLabelText}>
              {discoveryCategories.map((category) => (
                <a className="section-discovery-link" href={editorialArchiveHref({ category, page: 1 })} key={category}>{category}</a>
              ))}
            </nav>
          </section>
        )}
      </section>
    );
  }

  return (
    <section className={['editorial-section', 'latest-section', variant === 'articles' && 'articles-feed', className].filter(Boolean).join(' ')} {...props}>
      {labelText && <p className="section-label">{labelText}</p>}
      <h2 className="section-title">{titleText}</h2>
      <ol className="story-list">
        {feed.posts.map((post, index) => (
          <li className="story-list-item" key={post.id}>
            <span className="story-number">{index + 1}</span>
            <div className="story-copy">
              {post.section && <p className="story-board">{post.section}</p>}
              <p className="story-title"><a className="story-title-link" href={post.href}>{post.title}</a></p>
              {variant === 'articles' && post.excerpt && <p className="story-excerpt">{post.excerpt}</p>}
              <div className="story-meta">
                {post.author?.name && <span>{post.author.name}</span>}
                {post.createdAtFormatted && <span>{post.createdAtFormatted}</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

type EditorialArticleProps = HTMLAttributes<HTMLElement> & {
  articleId?: string | number;
  loadingText?: string;
  invalidTitleText?: string;
  invalidBodyText?: string;
  unavailableTitleText?: string;
  unavailableBodyText?: string;
  forbiddenTitleText?: string;
  forbiddenBodyText?: string;
  notFoundTitleText?: string;
  notFoundBodyText?: string;
  backText?: string;
  previousText?: string;
  nextText?: string;
};

type EditorialArticleState = { status: 'loading' | EditorialArticleStatus; article: EditorialArticleData | null; continuation: EditorialContinuation };

export const EditorialArticle = ({
  articleId,
  loadingText,
  invalidTitleText,
  invalidBodyText,
  unavailableTitleText,
  unavailableBodyText,
  forbiddenTitleText,
  forbiddenBodyText,
  notFoundTitleText,
  notFoundBodyText,
  backText,
  previousText,
  nextText,
  className,
  ...props
}: EditorialArticleProps) => {
  const [state, setState] = useState<EditorialArticleState>({ status: 'loading', article: null, continuation: EMPTY_EDITORIAL_CONTINUATION });

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    setState({ status: 'loading', article: null, continuation: EMPTY_EDITORIAL_CONTINUATION });
    resolveEditorialArticle(articleId, { signal: controller.signal, context: currentArchiveQuery() }).then((result) => {
      if (mounted && !controller.signal.aborted && result.status !== 'aborted') {
        setState({ ...result, continuation: result.continuation ?? EMPTY_EDITORIAL_CONTINUATION });
      }
    });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [articleId]);

  const classes = ['article-page', className].filter(Boolean).join(' ');
  const archiveHref = editorialArchiveHref(currentArchiveQuery());
  if (state.status === 'loading') {
    return <section className={`${classes} article-state`} aria-live="polite" {...props}><p>{loadingText}</p></section>;
  }

  if (state.status !== 'content' || !state.article) {
    const title = state.status === 'invalid' ? invalidTitleText : state.status === 'not_found' ? notFoundTitleText : state.status === 'forbidden' ? forbiddenTitleText : unavailableTitleText;
    const body = state.status === 'invalid' ? invalidBodyText : state.status === 'not_found' ? notFoundBodyText : state.status === 'forbidden' ? forbiddenBodyText : unavailableBodyText;
    return (
      <section className={`${classes} article-state`} {...props}>
        <h2 className="section-title">{title}</h2>
        <p className="reading-measure">{body}</p>
        <a className="text-action" href={archiveHref}>{backText}</a>
      </section>
    );
  }

  const article = state.article;
  const { prev, next } = state.continuation;
  const sectionHref = article.section ? editorialArchiveHref({ category: article.section, page: 1 }) : null;
  return (
    <article className={classes} {...props}>
      <header className="article-header">
        {article.section && sectionHref && <a className="article-section" href={sectionHref}>{article.section}</a>}
        <h1 className="article-title">{article.title}</h1>
        {(article.author?.name || article.createdAtFormatted) && (
          <div className="article-meta">
            {article.author?.name && <span>{article.author.name}</span>}
            {article.createdAtFormatted && <span>{article.createdAtFormatted}</span>}
          </div>
        )}
      </header>
      {article.visual && (
        <figure className="article-hero-figure">
          <Img className="article-hero-visual" src={article.visual} alt={article.title} />
        </figure>
      )}
      <div className="article-reading-column">
        <EditorialContent content={article.body} contentMode={article.bodyMode ?? 'text'} />
        <footer className="article-footer">
          {(article.author?.name || article.createdAtFormatted) && (
            <p className="article-footer-meta">{[article.author?.name, article.createdAtFormatted].filter(Boolean).join(' · ')}</p>
          )}
          {(prev || next) && (
            <nav className="article-continuation" aria-label={`${previousText ?? ''} / ${nextText ?? ''}`}>
              {prev && (
                <a className="article-continuation-link article-continuation-prev" href={prev.href} aria-label={`${previousText}: ${prev.title}`}>
                  <span className="article-continuation-label">{previousText}</span>
                  <span className="article-continuation-title">{prev.title}</span>
                </a>
              )}
              {next && (
                <a className="article-continuation-link article-continuation-next" href={next.href} aria-label={`${nextText}: ${next.title}`}>
                  <span className="article-continuation-label">{nextText}</span>
                  <span className="article-continuation-title">{next.title}</span>
                </a>
              )}
            </nav>
          )}
          <a className="text-action article-back" href={archiveHref}>{backText}</a>
        </footer>
      </div>
    </article>
  );
};

export const templateMetadata = { identifier: 'glitter-editorial', version: '0.1.0-beta.24' } as const;
