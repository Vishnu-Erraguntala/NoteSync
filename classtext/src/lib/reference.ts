export type ModuleMeta = {
  id: string;
  title: string;
};

const idPattern = /@module:([a-zA-Z0-9-_]+)/g;
const titlePattern = /@module\[(.+?)\]/g;

export function moduleAnchor(id: string) {
  return `module-${id}`;
}

export function resolveModuleReferences(
  markdown: string,
  modules: ModuleMeta[],
) {
  const byId = new Map(modules.map((mod) => [mod.id, mod]));
  const byTitle = new Map(
    modules.map((mod) => [normalizeTitle(mod.title), mod]),
  );

  const replaceId = markdown.replace(idPattern, (_, moduleId) => {
    const target = byId.get(moduleId);
    if (!target) return `@module:${moduleId}`;
    return `[${target.title}](#${moduleAnchor(target.id)})`;
  });

  const replaceTitle = replaceId.replace(titlePattern, (_, title) => {
    const target = byTitle.get(normalizeTitle(title));
    if (!target) return `@module[${title}]`;
    return `[${target.title}](#${moduleAnchor(target.id)})`;
  });

  return replaceTitle;
}

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

