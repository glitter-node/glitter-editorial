# Glitter Editorial

Glitter Editorial은 **G7에서 콘텐츠 중심 사이트를 바로 시작하기 위한 범용 User Template**입니다. 독립 출판, 저널, 매거진, 장문 기사 사이트를 위해 Home, Archive, Search, Article Reader, About 흐름을 제공합니다.

별도 CMS나 article 데이터베이스를 만들지 않습니다. 공개 G7 Template 계약과 `sirsoft-board`의 공개 API, 권한 및 정렬 의미를 그대로 사용합니다.

```text
sirsoft-board
      ↓
Editorial adapter
      ↓
Home → Archive/Search → Article Reader
```

## Product contract

- Home: 첫 글은 Lead Story, 나머지는 Latest Stories
- Archive: backend pagination, board-local category, text search
- Reader: text/제한된 HTML 본문, optional visual, Archive 복귀, Previous/Next
- About: 템플릿의 editorial principles와 mission
- Content source: canonical package default는 `sirsoft-board / editorial`

`articles`, `stories`, `news` board 탐색은 기존 beta 설치를 위한 호환 fallback입니다. 장기적인 operator configuration 계약이나 전역 editorial taxonomy가 아닙니다.

## Requirements

배포 manifest가 요구하는 최소 버전은 다음과 같습니다.

- G7 `>=7.0.6`
- `sirsoft-board >=1.0.0` (the first stable release proven to provide the public, category-aware article navigation contract used by this template)
- PHP 8.2 이상(G7 host requirement)
- Laravel 12.x: 현재 지원 G7 host 기준; 템플릿은 별도 Composer constraint를 선언하지 않음
- Node.js `^20.19.0` 또는 `>=22.12.0`: source/build 작업 시 현재 Vite 7 toolchain 기준

배포된 `dist/` asset은 저장소에 포함됩니다. 그대로 설치할 때 Node.js는 필요하지 않으며, source를 검증·변경하거나 asset을 다시 build할 때만 Node.js와 npm이 필요합니다.

## Start here

1. [Installation](docs/installation.md) — 배치, board 준비, 설치, 활성화
2. [Content and UX contract](docs/content-contract.md) — source, field mapping, routes, Search와 Reader 의미
3. [Operations](docs/operations.md) — update, verification, 보안, limitation과 migration
4. [Extension boundary](docs/extension-boundary.md) — 수정 가능한 범위
5. [Responsive baseline](docs/responsive-baseline.md) — beta.24 responsive architecture와 변경 규칙

## Design language

Paper tone, serif editorial typography, whitespace, 읽기 중심 measure를 사용합니다. 구획은 divider, card, shadow보다 typography와 spacing으로 표현하며 Header/Footer는 미세한 surface 차이만 둡니다.

두 primary responsive boundary는 48rem과 64rem입니다. Compact Header는 brand와 navigation을 한 행에 유지하고, content grid는 정해진 layout boundary에서 단계적으로 확장됩니다.

이 Phase는 theme customizer를 제공하지 않습니다. 스타일 변경은 template source를 관리하고 다시 build하는 개발 작업입니다.

## Repository structure

```text
layouts/         G7 JSON page/layout definitions
components.json  template component registry
src/             React components, content adapter, sanitizer, styles
contracts/       production source-selection contract
docs/rfcs/       research and upstream proposals; production features 아님
__tests__/       contract and regression fixtures
dist/            committed production frontend assets
lang/            Korean/English strings
```

## Development verification

```bash
npm ci
npm test
npm run type-check
npm run build
```

테스트는 isolated fixture를 사용하므로 production DB에 article을 만들 필요가 없습니다. 자세한 검증과 HTTP smoke 절차는 [Operations](docs/operations.md)를 참고하세요.

## Status and demo

- Status: Open Beta `0.1.0-beta.25`
- Demo: [glitter.kr](https://glitter.kr) — 하나의 운영 예시이며 제품 계약이나 필수 host가 아닙니다.
- Changes: [CHANGELOG.md](CHANGELOG.md)
- License: MIT
