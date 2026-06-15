import PizZip from "pizzip";

const TAG_REGEXES = [
  /<<\s*([^<>]+?)\s*>>/g,
  /\{\{\s*([^{}]+?)\s*\}\}/g,
];

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizedTextFromWordXml(xml: string): string {
  const mergedRuns = xml.replace(/<\/w:t>\s*<w:t[^>]*>/g, "");
  const noTags = mergedRuns.replace(/<[^>]+>/g, "");
  return decodeXmlEntities(noTags);
}

export function extractTemplateTagsFromDocxBuffer(buffer: Buffer): string[] {
  const zip = new PizZip(buffer);
  const files = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/") && name.endsWith(".xml"),
  );
  const tags = new Set<string>();

  for (const fileName of files) {
    const xml = zip.file(fileName)?.asText() ?? "";
    const normalizedText = normalizedTextFromWordXml(xml);
    for (const regex of TAG_REGEXES) {
      for (const source of [xml, normalizedText]) {
        regex.lastIndex = 0;
        let match: RegExpExecArray | null = regex.exec(source);
        while (match) {
          const tag = match[1]?.trim();
          if (tag) tags.add(tag);
          match = regex.exec(source);
        }
      }
    }
  }

  return Array.from(tags).sort((a, b) => a.localeCompare(b, "fr"));
}
