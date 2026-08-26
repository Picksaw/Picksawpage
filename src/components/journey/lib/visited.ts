/**
 * visitedStore — which template buildings the visitor actually reached.
 *
 * The observatory's holographic map lights up the towers you walked
 * past, so the finale's line ("every building you walked through is a
 * real template") is backed by a record of the walk rather than being
 * a claim.
 *
 * A plot counts as visited once the camera has come within the portal's
 * approach radius. Kept out of React state deliberately: this is read
 * every frame by the map shader and written from the camera update.
 */

const visited = new Set<string>();
const listeners = new Set<(ids: string[]) => void>();

export const visitedStore = {
  has(id: string): boolean {
    return visited.has(id);
  },

  add(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const list = [...visited];
    for (const l of listeners) l(list);
  },

  get count(): number {
    return visited.size;
  },

  list(): string[] {
    return [...visited];
  },

  subscribe(fn: (ids: string[]) => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  reset() {
    visited.clear();
    for (const l of listeners) l([]);
  },
};
