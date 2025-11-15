## NoteSync

An MVP web app that lets high school students collaboratively write a modular textbook for each class. No AI shortcuts—just Markdown, version history, references, and a compiler that exports clean HTML + PDF.

### Tech stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, SWR
- **Backend**: Next.js API routes, Prisma ORM, SQLite (swap to Postgres later)
- **Content**: Markdown everywhere with React Markdown preview + `marked` on the server, HTML → PDF via `html-pdf-node`

### Local development

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Prisma uses SQLite by default (`DATABASE_URL="file:./dev.db"`). To create/update the database schema:

```bash
npx prisma migrate dev
npx prisma studio # optional browser DB viewer
```

### Core flows

1. **Login**: Enter a display name (stored in `localStorage`). Every API request includes the `x-user-name` header so Prisma can look up/create the corresponding `User` row.
2. **Courses**: Create or join via code, then land on the module hub. Roles (student vs teacher) come from `CourseMember.role`.
3. **Modules**: Create/edit Markdown content with title, type, tags, and live preview. Module saves create `ModuleVersion` history and update `Module.currentVersionId`. Autosave persists drafts to local storage and prompts to restore newer drafts.
4. **Versioning**: Inspect previous versions, view line-based diffs, restore a version (which creates a new head version), or download Markdown.
5. **References**: Use `@module:<id>` or `@module[Title]` to link to other modules. The helper sidebar inserts references, previews are resolved in the editor, and the compiler converts them to anchored links.
6. **Compile**: Arrange modules, toggle inclusion, save compilation presets, and generate HTML + PDF textbooks. The PDF download link appears automatically after compilation.

### Export + API surface

- `GET /api/courses`, `POST /api/courses`, `POST /api/courses/join`
- `GET /api/courses/:courseId`, `GET|POST /api/courses/:courseId/modules`
- `GET|PUT|DELETE /api/modules/:moduleId`
- `GET /api/modules/:moduleId/versions`, `POST /api/modules/:moduleId/restore`
- `GET /api/modules/:moduleId/markdown`
- `GET|POST /api/compilations`, `GET /api/compilations/:id`
- `POST /api/compile`

Each route requires the `x-user-name` header to stay aligned with the lightweight login strategy.

### Swapping to Postgres later

Update `DATABASE_URL` in `.env`, run `npx prisma migrate deploy`, and restart the dev server. The Prisma schema is ready for Postgres without code changes.
