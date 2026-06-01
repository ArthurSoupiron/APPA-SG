import { getMarketingEnv } from "./marketing-env";

type BlockContent = Record<string, unknown>;

export function renderBlocksToHtml(
  blocks: { blockType: string; content: BlockContent; trackId: string; sortOrder: number }[],
  opts: { campaignId: string; subscriberId?: string; baseUrl: string },
): string {
  const parts = [...blocks]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((block) => renderBlock(block, opts));

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;">${parts.join("")}</body></html>`;
}

function trackClickUrl(
  baseUrl: string,
  campaignId: string,
  subscriberId: string | undefined,
  trackId: string,
  url: string,
): string {
  const q = new URLSearchParams({
    c: campaignId,
    t: trackId,
    u: url,
  });
  if (subscriberId) q.set("s", subscriberId);
  return `${baseUrl}/api/public/newsletter/click?${q.toString()}`;
}

function renderBlock(
  block: { blockType: string; content: BlockContent; trackId: string },
  opts: { campaignId: string; subscriberId?: string; baseUrl: string },
): string {
  const c = block.content;
  const blockWrap = (inner: string) =>
    `<div data-track="${escapeHtml(block.trackId)}" style="display:block;margin:16px 0;">${inner}</div>`;

  switch (block.blockType) {
    case "heading":
      return blockWrap(`<h2>${escapeHtml(String(c.text ?? ""))}</h2>`);
    case "text":
      return blockWrap(
        `<p style="white-space:normal;word-break:break-word;">${escapeHtml(String(c.text ?? ""))}</p>`,
      );
    case "button": {
      const href = String(c.url ?? "#");
      const tracked = trackClickUrl(opts.baseUrl, opts.campaignId, opts.subscriberId, block.trackId, href);
      return blockWrap(
        `<a href="${escapeHtml(tracked)}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">${escapeHtml(String(c.label ?? "En savoir plus"))}</a>`,
      );
    }
    case "image":
      return blockWrap(
        `<img src="${escapeHtml(String(c.src ?? ""))}" alt="${escapeHtml(String(c.alt ?? ""))}" style="max-width:100%;height:auto;" />`,
      );
    case "divider":
      return blockWrap('<hr style="border:none;border-top:1px solid #ddd;" />');
    case "html":
      return blockWrap(String(c.html ?? ""));
    default:
      return blockWrap(`<p>${escapeHtml(String(c.text ?? ""))}</p>`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function injectOpenPixel(html: string, pixelUrl: string): string {
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
  if (html.includes("</body>")) return html.replace("</body>", `${pixel}</body>`);
  return `${html}${pixel}`;
}

export function defaultFooterHtml(unsubscribeUrl: string): string {
  const env = getMarketingEnv();
  return `
<p style="font-size:12px;color:#666;white-space:normal;">
  <a href="${unsubscribeUrl}">Se désabonner</a> ·
  <a href="${env.newsletterPublicBaseUrl}/confidentialite">Politique de confidentialité</a> ·
  <a href="${env.newsletterPublicBaseUrl}/mentions-legales">Mentions légales</a>
</p>`;
}
