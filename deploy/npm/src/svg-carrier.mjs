/** Keep HTML parsing and the existing loader inside a same-origin HTML document. */
export function svgCarrier(html) {
  const payload = Buffer.from(html, "utf8").toString("base64");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:fixed;inset:0;background:#151216">
<title>learnmathedu</title>
<foreignObject width="100%" height="100%"><body xmlns="http://www.w3.org/1999/xhtml" style="margin:0;height:100%"><iframe id="carrier" title="Application" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe></body></foreignObject>
<script><![CDATA[
(() => {
  const html = new TextDecoder().decode(Uint8Array.from(atob("${payload}"), c => c.charCodeAt(0)));
  const frame = document.getElementById("carrier");
  // A document-written about:blank frame has no service-worker client of its
  // own. Use the outer SVG client for registration, control, and messaging.
  if ("serviceWorker" in navigator) {
    Object.defineProperty(frame.contentWindow.navigator, "serviceWorker", {
      value: navigator.serviceWorker, configurable: true
    });
  }
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
})();
]]></script>
</svg>\n`;
}

export function svgCarrierHtml(svg) {
  const match = svg.match(/atob\("([A-Za-z0-9+/=]+)"\)/);
  if (!match) throw new Error("SVG carrier has no embedded HTML payload");
  const html = Buffer.from(match[1], "base64").toString("utf8");
  if (svgCarrier(html) !== svg) throw new Error("SVG carrier wrapper or payload is invalid");
  return html;
}
