# Changelog

## [0.1.0-beta.25]

### Fixed

- Selected the first compatible Editorial board from sirsoft-board's active, guest-readable public board directory before requesting the selected board metadata.
- Removed missing-candidate detail probes, including the normal `editorial` 404 on installations whose preferred board does not exist.
- Kept Home, Archive, and Article Reader on the same shared board resolver and preserved the existing empty-publication fallback when no eligible candidate is listed.

## [0.1.0-beta.24]

### Changed

- Kept the restored static Header on one mobile row by tightening only its existing responsive gaps.
- Reconciled responsive documentation with the accepted beta.24 implementation.
- Established beta.24 as the responsive architecture baseline after Phase 18 verification.

## [0.1.0-beta.23]

### Changed

- Rolled the Header back to the pre-hamburger static navigation structure for real-device visibility confirmation.

## [0.1.0-beta.22]

### Changed

- Replaced the mobile JavaScript menu state with a native disclosure while preserving the desktop header.

## [0.1.0-beta.21]

### Changed
- Replaced the mobile inline navigation with an accessible local hamburger disclosure while preserving the desktop header.

## [0.1.0-beta.20]

### Fixed
- Kept the mobile primary navigation on one line by separating it from the brand row without changing the desktop header.

## [0.1.0-beta.19]

### Changed
- Corrected responsive typography continuity around the tablet boundary while preserving the existing layout and container architecture.

## [0.1.0-beta.18]

### Changed
- Corrected the minimum sirsoft-board dependency from `>=1.0.3` to the locally proven stable minimum `>=1.0.0`, which provides every public board, search, article, and category-aware navigation contract used by the template.

## [0.1.0-beta.17]

### Added
- Added minimal Previous/Next story navigation to the Article Footer using sirsoft-board's public, guest-readable navigation endpoint.

### Changed
- Preserved Archive category, search, and page context across consecutive article reads while keeping server-defined board ordering and category adjacency authoritative.
- Made continuation lookup fail independently so a navigation error hides the optional links without failing a valid Article Reader.

## [0.1.0-beta.16]

### Added
- Added restrained optional visuals to Home Lead and Latest stories using only verified board thumbnails, with no placeholders for missing media.
- Added fixture coverage for zero, one, two, three, four, six, and ten-plus article Home states, including long titles and mixed optional fields.

### Changed
- Made one- and two-item Latest groups use content-width layouts while preserving the existing Lead-first curation and six-post Home request.
- Compacted the empty publication and supporting brand-section spacing so articles remain the primary Home hierarchy as content density grows.

## [0.1.0-beta.15]

### Added
- Added a board-backed Home Section index when a non-empty publication exposes at least two real categories, without adding an API request or taxonomy route.
- Linked Lead, Latest, and Archive story category metadata to the canonical first page of the existing category-filtered Archive.

### Changed
- Reused the board-local category value unchanged across Home, Archive, and Article Detail, including Unicode and punctuation-safe query encoding.
- Kept empty publications, boards without categories, and single-category publications free of a redundant Section Discovery block.

## [0.1.0-beta.14]

### Added
- Declared the sirsoft-board provider and preferred Editorial board identity in the existing template bootstrap/config payload.
- Connected Article Detail SEO title and optional OG image to the guest-public sirsoft-board detail resource without inventing publication metadata.

### Changed
- Made the shared browser resolver try the bootstrap source directly before board discovery, while retaining the deterministic eligibility fallback for stale or unavailable sources.
- Kept the board-selection JSON contract as the candidate and bootstrap source declaration consumed by the client build.

## [0.1.0-beta.13]

### Added
- Added an optional article hero visual, board-local Section link, and quiet article footer metadata to the Editorial reader.
- Added safe WYSIWYG image, figure, and caption rendering within the existing DOMPurify boundary.
- Added a distinct forbidden article state without weakening sirsoft-board guest permissions.

### Changed
- Reworked Detail typography around a wide header/media area and a narrow long-form reading column.
- Refined paragraphs, headings, blockquotes, nested lists, links, code, and responsive media without section rules or card treatments.

## [0.1.0-beta.12]

### Added
- Added a URL-driven Editorial Archive with board-backed pagination, board-local category navigation, optional visuals, and accessible pagination controls.
- Added canonical archive/list-context helpers so article detail links preserve `page` and `category` for round-trip navigation.

### Changed
- Reused the Phase 1 board resolver and normalized Article read model across Home, Archive, and Detail.
- Replaced the generic `/articles` feed presentation with a whitespace-led archive layout and kept the empty publication state intact.

## [0.1.0-beta.11]

- Consolidated list and detail board responses into one minimal Editorial article read model.
- Added one validated canonical `/articles/{id}` href builder and removed repeated URL construction from presentation code.
- Preserved section, stable member identity, raw creation time, formatted time, excerpt/body distinction, and optional board thumbnail without inventing publication fields.
- Marked the ordered board candidates explicitly as a compatibility heuristic because G7 has no supported User Template content-source settings contract yet.

## [0.1.0-beta.10]

- Removed all Home editorial rules, including the publication boundary, story-item rules, and Principles column rules.
- Replaced Header and Footer borders with a restrained neutral paper-tone background.
- Rebalanced section spacing, mobile rhythm, grid alignment, and Principles typography so whitespace and composition carry the hierarchy.

## [0.1.0-beta.9]

- Removed repetitive full-width Home section dividers and made whitespace and typography the primary grouping system.
- Retained only the header bottom rule, the Hero-to-publication rule, short Principles rules, and the footer top rule.
- Rebalanced desktop and mobile section spacing and preserved the primary publication rule for both populated and empty feeds.

## [0.1.0-beta.8]

- Reframed Home around one verified lead story and a latest-stories sequence backed by the existing guest-public Editorial feed.
- Kept the brand statement, principles, mission, and concluding note while moving published content to the primary reading position.
- Added translated feed actions, footer navigation, and a responsive editorial hierarchy without placeholder content or imagery.
- Refined focus, touch targets, typography, spacing, and narrow-screen behavior while preserving the paper-and-ink visual identity.

## [0.1.0-beta.7]

- Declared the canonical guest-public `/` route explicitly and mapped it to the existing Home layout.
- Added a routing regression contract that keeps `/articles` valid while unknown paths remain unregistered.

## [0.1.0-beta.6]

- Defined one shared Editorial publication predicate for feed and detail responses.
- Limited public article presentation to non-secret, published root posts while retaining published root notices as articles.
- Rejected blinded, deleted, secret, reply, and malformed publication-state responses before links or article rendering.
- Forced Editorial API reads to omit credentials so board eligibility and article access remain genuinely guest-public.

## [0.1.0-beta.5]

- Aligned Home, About, SEO, and template descriptions with the supported single-Articles publication IA.
- Removed reader-facing claims that Columns, Features, and News are implemented collections.
- Preserved the Home, Articles, Article Detail, and About routes without adding unsupported taxonomy routes.

## [0.1.0-beta.4]

- Extracted one shared Editorial board resolver for Home, Articles, and Article Detail.
- Added the `/articles/:id` reader route and fail-closed `EditorialArticle` component.
- Rendered text and HTML bodies exclusively through the owned `EditorialContent` security boundary.
- Linked verified Home and Articles post titles to the Editorial Article Detail route.
- Added translated loading, invalid, unavailable, missing, and back-navigation states.

## [0.1.0-beta.3]

- Added an internal DOMPurify-owned EditorialContent foundation with a tested, explicit long-form content allowlist.
- Added scoped editorial body typography without exposing an Article Detail route or changing current page behavior.
- Added the `/articles` publication index with translated SEO metadata and a reader-facing zero-data state.
- Reused the single EditorialFeed orchestration path for Home and Articles with a verified ten-post Articles request.
- Added Articles to primary navigation while keeping titles non-interactive until Article Detail exists.
- Added verified plain-text post previews without rendering raw HTML.

## [0.1.0-beta.2]

- Added the client-side EditorialFeed orchestrator through the supported ComponentRegistry IIFE contract.
- Enforced ordered board eligibility checks before loading a five-post selected-board feed.
- Added abort-safe, fail-closed empty-state behavior and deterministic orchestration regression tests.

## [0.1.0-beta.1]

- Added the initial bundled user-template skeleton.
- Added Home, About, and 403/404/500 layouts.
- Added complete Korean and English translation catalogs.
- Added the responsive editorial visual foundation and G7 lifecycle support.
- Fixed the component manifest contract for G7 ComponentRegistry runtime loading.
- Connected the Home layout to generic recent and popular post feeds with a zero-data fallback.
- Replaced the generic cross-board feeds with an explicit editorial board selection contract.
- Kept Home in a conservative no-selection state until G7 can enforce candidate eligibility before fetching posts.
