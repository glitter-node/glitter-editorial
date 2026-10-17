import editorialBoardSelection from '../contracts/editorial-board-selection.json' with { type: 'json' };

const parsedCandidates = Array.isArray(editorialBoardSelection?.candidates)
  ? editorialBoardSelection.candidates.filter((slug) => typeof slug === 'string' && slug.trim())
  : [];

export const EDITORIAL_BOARD_CANDIDATES = Object.freeze([...parsedCandidates]);
export const EDITORIAL_CONTENT_SOURCE = Object.freeze({
  provider: editorialBoardSelection?.provider === 'sirsoft-board' ? editorialBoardSelection.provider : null,
  board: typeof editorialBoardSelection?.bootstrap_source === 'string'
    && parsedCandidates.includes(editorialBoardSelection.bootstrap_source)
    ? editorialBoardSelection.bootstrap_source
    : null,
});
export const EDITORIAL_SEARCH_PARAM = 'search';

export const EMPTY_EDITORIAL_FEED = Object.freeze({ selectedBoard: null, posts: [] });
export const EMPTY_EDITORIAL_ARCHIVE = Object.freeze({ selectedBoard: null, posts: [], categories: [], pagination: null, context: { page: 1, category: null, search: null } });
export const EMPTY_EDITORIAL_ARTICLE = Object.freeze({ status: 'unavailable', article: null });
export const EMPTY_EDITORIAL_CONTINUATION = Object.freeze({ prev: null, next: null });

const BOARD_API = '/api/modules/sirsoft-board/boards';

class EditorialHttpError extends Error {
  constructor(status) {
    super('Editorial request failed');
    this.status = status;
  }
}

const getJson = async (fetchImpl, url, signal) => {
  const response = await fetchImpl(url, {
    method: 'GET',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response?.ok) throw new EditorialHttpError(response?.status);
  return response.json();
};

const listedCandidateSlugs = (payload) => {
  if (payload?.success !== true || !Array.isArray(payload.data)) throw new Error('Malformed board list');
  const listed = new Set();
  for (const board of payload.data) {
    if (!board || typeof board !== 'object' || typeof board.slug !== 'string') throw new Error('Malformed board list item');
    if (EDITORIAL_BOARD_CANDIDATES.includes(board.slug)) listed.add(board.slug);
  }
  return EDITORIAL_BOARD_CANDIDATES.filter((slug) => listed.has(slug));
};

const parseCandidateDetail = (payload, expectedSlug) => {
  const board = payload?.data;
  if (payload?.success !== true || !board || typeof board !== 'object') throw new Error('Malformed board detail');
  if (board.slug !== expectedSlug || typeof board.is_active !== 'boolean' || typeof board.user_abilities?.can_read !== 'boolean') {
    throw new Error('Malformed board eligibility');
  }
  return board;
};

const selectedBoardView = (board) => ({
  id: board.id,
  slug: board.slug,
  name: board.name,
  categories: Array.isArray(board.categories)
    ? board.categories.filter((category) => typeof category === 'string' && category.trim())
    : [],
});

export function validateArticleId(value) {
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export const normalizeEditorialArchiveContext = (value = {}) => {
  const params = value instanceof URLSearchParams
    ? value
    : typeof value === 'string'
      ? new URLSearchParams(value.startsWith('?') ? value.slice(1) : value)
      : new URLSearchParams(Object.entries(value).flatMap(([key, entry]) => entry == null ? [] : [[key, String(entry)]]));
  const rawPage = params.get('page');
  const page = rawPage && /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) && Number(rawPage) > 0
    ? Number(rawPage)
    : 1;
  return { page, category: optionalString(params.get('category')), search: optionalSearchString(params.get(EDITORIAL_SEARCH_PARAM)) };
};

export const editorialArchiveHref = (context = {}) => {
  const normalized = normalizeEditorialArchiveContext(context);
  const params = new URLSearchParams();
  if (normalized.category) params.set('category', normalized.category);
  if (normalized.search) params.set(EDITORIAL_SEARCH_PARAM, normalized.search);
  if (normalized.page > 1) params.set('page', String(normalized.page));
  const query = params.toString();
  return query ? `/articles?${query}` : '/articles';
};

export const editorialDiscoveryCategories = (selectedBoard, posts) => {
  if (!selectedBoard || !Array.isArray(posts) || posts.length === 0) return [];
  const categories = Array.isArray(selectedBoard.categories) ? selectedBoard.categories : [];
  return categories.length >= 2 ? categories : [];
};

export const editorialArticleHref = (value, context) => {
  const id = validateArticleId(value);
  if (id === null) return null;
  const archiveHref = editorialArchiveHref(context);
  const queryIndex = archiveHref.indexOf('?');
  return `/articles/${id}${queryIndex === -1 ? '' : archiveHref.slice(queryIndex)}`;
};

const optionalString = (value) => typeof value === 'string' && value.trim() ? value : null;
const optionalSearchString = (value) => typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeAuthor = (author) => {
  if (!author || typeof author !== 'object') return null;
  const id = optionalString(author.uuid);
  const name = optionalString(author.name);
  const avatar = optionalString(author.avatar);
  const isGuest = typeof author.is_guest === 'boolean' ? author.is_guest : id === null;
  return id || name || avatar ? { id, name, avatar, isGuest } : null;
};

const normalizeEditorialArticle = (post, { body = null, bodyMode = null, excerpt = null } = {}) => ({
  id: post.id,
  href: editorialArticleHref(post.id),
  title: post.title,
  excerpt,
  body,
  bodyMode,
  section: optionalString(post.category),
  author: normalizeAuthor(post.author),
  createdAt: optionalString(post.created_at),
  createdAtFormatted: optionalString(post.created_at_formatted),
  visual: optionalString(post.thumbnail),
});

const assertEditorialPublicationFields = (post) => {
  if (
    typeof post.status !== 'string'
    || typeof post.is_secret !== 'boolean'
    || typeof post.is_notice !== 'boolean'
    || !(post.parent_id === null || (Number.isSafeInteger(post.parent_id) && post.parent_id > 0))
    || !Number.isSafeInteger(post.depth)
    || post.depth < 0
  ) throw new Error('Malformed post publication state');
};

export const isEditoriallyPublishable = (post) => Boolean(
  post
  && post.status === 'published'
  && post.is_secret === false
  && post.parent_id === null
  && post.depth === 0
);

export const resolveEditorialBoard = async ({ fetchImpl = globalThis.fetch, signal } = {}) => {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (typeof fetchImpl !== 'function') throw new Error('Editorial fetch unavailable');
  // Public board discovery already returns only active boards readable by the
  // current caller. Select from that authoritative directory before loading the
  // chosen board's full metadata, so absent compatibility candidates are never
  // probed through a normal 404 detail response.
  const candidates = listedCandidateSlugs(await getJson(fetchImpl, BOARD_API, signal));
  const selectedSlug = candidates[0];
  if (!selectedSlug) return null;
  const detail = parseCandidateDetail(
    await getJson(fetchImpl, `${BOARD_API}/${encodeURIComponent(selectedSlug)}?include_user_abilities=1`, signal),
    selectedSlug,
  );
  return detail.is_active && detail.user_abilities.can_read ? selectedBoardView(detail) : null;
};

const parsePosts = (payload) => {
  const posts = payload?.data?.data;
  if (payload?.success !== true || !Array.isArray(posts)) throw new Error('Malformed post list');
  return posts.flatMap((post) => {
    if (!post || typeof post !== 'object' || !Number.isSafeInteger(post.id) || post.id <= 0 || typeof post.title !== 'string' || !post.title.trim()) {
      throw new Error('Malformed post item');
    }
    assertEditorialPublicationFields(post);
    if (!isEditoriallyPublishable(post)) return [];
    return [normalizeEditorialArticle(post, { excerpt: optionalString(post.content_preview) })];
  });
};

const parsePagination = (payload) => {
  const pagination = payload?.data?.pagination;
  if (
    !pagination
    || !Number.isSafeInteger(pagination.current_page)
    || pagination.current_page < 1
    || !Number.isSafeInteger(pagination.per_page)
    || pagination.per_page < 1
    || !Number.isSafeInteger(pagination.count)
    || pagination.count < 0
    || !(pagination.last_page === null || (Number.isSafeInteger(pagination.last_page) && pagination.last_page >= 1))
    || typeof pagination.has_more_pages !== 'boolean'
  ) throw new Error('Malformed post pagination');
  return {
    currentPage: pagination.current_page,
    lastPage: pagination.last_page,
    perPage: pagination.per_page,
    count: pagination.count,
    total: Number.isSafeInteger(pagination.total) && pagination.total >= 0 ? pagination.total : null,
    hasMorePages: pagination.has_more_pages,
  };
};

export const resolveEditorialFeed = async ({ fetchImpl = globalThis.fetch, signal, pageSize = 5 } = {}) => {
  try {
    const selectedBoard = await resolveEditorialBoard({ fetchImpl, signal });
    if (!selectedBoard) return EMPTY_EDITORIAL_FEED;
    const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 10) : 5;
    const posts = parsePosts(await getJson(
      fetchImpl,
      `${BOARD_API}/${encodeURIComponent(selectedBoard.slug)}/posts?per_page=${safePageSize}`,
      signal,
    ));
    return { selectedBoard, posts };
  } catch {
    return EMPTY_EDITORIAL_FEED;
  }
};

export const resolveEditorialArchive = async ({ fetchImpl = globalThis.fetch, signal, pageSize = 10, context = {} } = {}) => {
  const normalizedContext = normalizeEditorialArchiveContext(context);
  try {
    const selectedBoard = await resolveEditorialBoard({ fetchImpl, signal });
    if (!selectedBoard) return { ...EMPTY_EDITORIAL_ARCHIVE, context: normalizedContext };
    const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 10;
    const params = new URLSearchParams({ per_page: String(safePageSize), page: String(normalizedContext.page) });
    if (normalizedContext.category) params.set('category', normalizedContext.category);
    if (normalizedContext.search) params.set(EDITORIAL_SEARCH_PARAM, normalizedContext.search);
    const payload = await getJson(
      fetchImpl,
      `${BOARD_API}/${encodeURIComponent(selectedBoard.slug)}/posts?${params.toString()}`,
      signal,
    );
    return {
      selectedBoard,
      posts: parsePosts(payload).map((post) => ({ ...post, href: editorialArticleHref(post.id, normalizedContext) })),
      categories: selectedBoard.categories,
      pagination: parsePagination(payload),
      context: normalizedContext,
    };
  } catch {
    return { ...EMPTY_EDITORIAL_ARCHIVE, context: normalizedContext };
  }
};

const parseArticle = (payload, expectedId) => {
  const post = payload?.data;
  if (
    payload?.success !== true
    || !post
    || typeof post !== 'object'
    || post.id !== expectedId
    || typeof post.title !== 'string'
    || !post.title.trim()
    || !['text', 'html'].includes(post.content_mode)
    || typeof post.content !== 'string'
    || !post.content.trim()
  ) throw new Error('Malformed article detail');
  assertEditorialPublicationFields(post);
  if (!isEditoriallyPublishable(post)) throw new Error('Ineligible article detail');
  return normalizeEditorialArticle(post, { body: post.content, bodyMode: post.content_mode });
};

const parseContinuation = (payload, currentId, context) => {
  if (payload?.success !== true || !payload.data || typeof payload.data !== 'object') return EMPTY_EDITORIAL_CONTINUATION;
  const parseSide = (side) => {
    if (side === null) return null;
    if (
      !side
      || typeof side !== 'object'
      || !Number.isSafeInteger(side.id)
      || side.id <= 0
      || side.id === currentId
      || typeof side.title !== 'string'
      || !side.title.trim()
    ) return null;
    const href = editorialArticleHref(side.id, context);
    return href ? { id: side.id, title: side.title, href } : null;
  };
  return { prev: parseSide(payload.data.prev), next: parseSide(payload.data.next) };
};

export const resolveEditorialArticle = async (articleId, { fetchImpl = globalThis.fetch, signal, context = {} } = {}) => {
  const id = validateArticleId(articleId);
  if (id === null) return { status: 'invalid', article: null };
  if (signal?.aborted) return { status: 'aborted', article: null };
  try {
    const selectedBoard = await resolveEditorialBoard({ fetchImpl, signal });
    if (!selectedBoard) return EMPTY_EDITORIAL_ARTICLE;
    const postUrl = `${BOARD_API}/${encodeURIComponent(selectedBoard.slug)}/posts/${id}`;
    const [payload, navigationPayload] = await Promise.all([
      getJson(fetchImpl, postUrl, signal),
      getJson(fetchImpl, `${postUrl}/navigation`, signal).catch(() => null),
    ]);
    return {
      status: 'content',
      article: parseArticle(payload, id),
      continuation: parseContinuation(navigationPayload, id, context),
    };
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') return { status: 'aborted', article: null };
    if (error instanceof EditorialHttpError && error.status === 404) return { status: 'not_found', article: null };
    if (error instanceof EditorialHttpError && error.status === 403) return { status: 'forbidden', article: null };
    return EMPTY_EDITORIAL_ARTICLE;
  }
};
