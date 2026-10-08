import type { Root } from 'mdast';

/**
 * Removes the leading `# H1`. It becomes the page title (see `titleFrom`), and
 * the layout renders the title itself.
 */
export function remarkStripTitle() {
  return (tree: Root) => {
    const [first] = tree.children;
    if (first?.type === 'heading' && first.depth === 1) {
      tree.children.shift();
    }
  };
}
