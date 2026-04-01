// Extract structure from BlockNote JSON blocks — replace content with placeholders
// Used by "Save as Template" to learn format from existing posts

interface InlineContent {
  type: string;
  text?: string;
  styles?: Record<string, boolean>;
  [key: string]: unknown;
}

interface BlockNode {
  type: string;
  props?: Record<string, unknown>;
  content?: InlineContent[];
  children?: BlockNode[];
}

// Placeholder text by block type — guides users on what to fill in
const PLACEHOLDER_TEXT: Record<string, string> = {
  heading: "Your Heading Here",
  paragraph: "Write your content here...",
  bulletListItem: "List item",
  checkListItem: "Checklist item",
  codeBlock: "// Your code here",
  image: "",
  table: "...",
};

// Counter for numbered list items within a single extraction
let numberedItemCounter = 0;

function getPlaceholder(blockType: string): string {
  if (blockType === "numberedListItem") {
    numberedItemCounter++;
    return `Step ${numberedItemCounter}`;
  }
  return PLACEHOLDER_TEXT[blockType] ?? "...";
}

// Replace text content with placeholder while preserving inline style structure
function replaceContent(content: InlineContent[] | undefined, placeholder: string): InlineContent[] {
  if (!content || content.length === 0) return [];
  // Keep one text node with placeholder, preserve styles from first styled node
  const firstStyled = content.find((c) => c.styles && Object.keys(c.styles).length > 0);
  return [{
    type: "text",
    text: placeholder,
    ...(firstStyled?.styles ? { styles: firstStyled.styles } : {}),
  }];
}

// Recursively walk blocks, strip content but preserve structure
function extractBlock(block: BlockNode): BlockNode {
  const placeholder = getPlaceholder(block.type);
  const result: BlockNode = {
    type: block.type,
    ...(block.props ? { props: { ...block.props } } : {}),
    content: block.type === "image"
      ? undefined // images have no inline content
      : replaceContent(block.content, placeholder),
    children: Array.isArray(block.children)
      ? block.children.map(extractBlock)
      : [],
  };

  // Clear image src but keep other props (width, caption structure)
  if (block.type === "image" && result.props) {
    result.props.url = "";
    result.props.caption = "Image description";
  }

  return result;
}

/**
 * Extract structure from BlockNote blocks array.
 * Replaces all text content with descriptive placeholders while
 * preserving block types, nesting, props (heading levels, code language, etc.).
 */
export function extractBlocksStructure(blocks: unknown[]): unknown[] {
  numberedItemCounter = 0;
  if (!Array.isArray(blocks)) return [];
  return (blocks as BlockNode[]).map(extractBlock);
}
