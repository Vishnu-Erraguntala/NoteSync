import { marked } from "marked";
import { ModuleMeta, moduleAnchor, resolveModuleReferences } from "./reference";

marked.use({
  gfm: true,
  breaks: true,
});

export function markdownToHtml(markdown: string) {
  return marked.parse(markdown);
}

type CompileModule = ModuleMeta & {
  type: string;
  contentMarkdown: string;
};

export function buildTextbookHtml(params: {
  courseName: string;
  compilationName: string;
  modules: CompileModule[];
}) {
  const { courseName, compilationName, modules } = params;

  const modulesMeta: ModuleMeta[] = modules.map(({ id, title }) => ({
    id,
    title,
  }));

  const toc = modules
    .map(
      (module, index) =>
        `<li><a href="#${moduleAnchor(module.id)}">${index + 1}. ${
          module.title
        }</a></li>`,
    )
    .join("");

  const sections = modules
    .map((module, index) => {
      const resolved = resolveModuleReferences(
        module.contentMarkdown,
        modulesMeta,
      );
      const sectionHtml = markdownToHtml(resolved);
      return `
        <section id="${moduleAnchor(module.id)}" class="module-section">
          <h2>${index + 1}. ${module.title}</h2>
          <p class="module-type">${module.type}</p>
          <div class="module-content">
            ${sectionHtml}
          </div>
        </section>
      `;
    })
    .join("\n");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${courseName} · ${compilationName}</title>
        <style>
          body {
            font-family: "Inter", system-ui, sans-serif;
            padding: 40px;
            background: #f8fafc;
            color: #0f172a;
            line-height: 1.65;
          }
          .title-page {
            text-align: center;
            margin-bottom: 48px;
          }
          .title-page h1 {
            font-size: 40px;
            margin-bottom: 0.25rem;
          }
          .title-page p {
            color: #475569;
          }
          .table-of-contents {
            background: #ffffff;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 15px 45px rgba(15, 23, 42, 0.08);
            margin-bottom: 40px;
          }
          .table-of-contents h2 {
            margin-top: 0;
          }
          .table-of-contents ul {
            list-style: none;
            padding-left: 0;
            columns: 2;
          }
          .table-of-contents li {
            margin-bottom: 8px;
          }
          .table-of-contents a {
            color: #2563eb;
            text-decoration: none;
          }
          .module-section {
            background: #ffffff;
            padding: 32px;
            border-radius: 24px;
            margin-bottom: 28px;
            box-shadow: 0 10px 35px rgba(15, 23, 42, 0.07);
          }
          .module-section h2 {
            margin-top: 0;
          }
          .module-type {
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 16px;
          }
          .module-content h3 {
            margin-top: 1.75rem;
          }
          .module-content code {
            background: #f1f5f9;
            padding: 2px 4px;
            border-radius: 4px;
          }
          .module-content pre {
            background: #0f172a;
            color: #e2e8f0;
            padding: 18px;
            border-radius: 12px;
            overflow-x: auto;
          }
          a {
            color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="title-page">
          <p>NoteSync · ${courseName}</p>
          <h1>${compilationName}</h1>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
        <div class="table-of-contents">
          <h2>Table of Contents</h2>
          <ul>${toc}</ul>
        </div>
        ${sections}
      </body>
    </html>
  `;
}

