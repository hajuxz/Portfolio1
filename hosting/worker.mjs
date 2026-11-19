// The build inlines the browser assets and the shared content schema in this module.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/portfolio") {
      const asset = files[url.pathname === "/" ? "/index.html" : url.pathname.replaceAll("%20"," ")];
      if (!asset || !["GET","HEAD"].includes(request.method)) return new Response(null,{status:404});
      const body = request.method === "HEAD" ? null : asset.base64 ? Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0)) : asset.text;
      return new Response(body,{headers:{"Content-Type":asset.base64 ? asset.mime : asset.mime+"; charset=utf-8","X-Content-Type-Options":"nosniff"}});
    }
    const headers = {"Content-Type":"application/json","Cache-Control":"no-store","X-Portfolio-Server":"1"};
    const reply = (status,value=null) => new Response(value === null ? null : JSON.stringify(value),{status,headers});
    try {
      const visitor = request.headers.get("oai-authenticated-user-id");
      const owner = await env.BUCKET.get("editor-owner");
      const ownerId = owner ? await owner.text() : null;
      const isOwner = !!visitor && visitor === ownerId;
      const startsPrivate = !!visitor && ownerId === null;
      const key = "published-portfolio";
      if (request.method === "GET") {
        const record = await env.BUCKET.get(key);
        headers.ETag = record?.httpEtag || '"initial"';
        return reply(200,{content:record ? await record.json() : PortfolioContent.defaults,canPublish:isOwner || startsPrivate});
      }
      if (request.method !== "PUT") return reply(405);
      if (!isOwner && !startsPrivate) return reply(403);
      if (request.headers.get("Origin") !== url.origin) return reply(403);
      if (!request.headers.get("Content-Type")?.startsWith("application/json")) return reply(415);
      const match = request.headers.get("If-Match");
      if (!match || !/^"(initial|[a-f0-9]+)"$/.test(match)) return reply(412);
      const maxSize = 12*1024*1024;
      if (!request.body || Number(request.headers.get("Content-Length")) > maxSize) return reply(413);
      const reader = request.body.getReader();
      const decoder = new TextDecoder();
      let size = 0, text = "";
      for (;;) {
        const {done,value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxSize) { await reader.cancel(); return reply(413); }
        text += decoder.decode(value,{stream:true});
      }
      let content;
      try { content = PortfolioContent.validate(JSON.parse(text+decoder.decode())); } catch { return reply(400); }
      // On the initial private Site, the first signed-in publisher claims the editor.
      if (startsPrivate && !await env.BUCKET.put("editor-owner",visitor,{onlyIf:{etagDoesNotMatch:"*"}})) return reply(409);
      const condition = match === '"initial"' ? {etagDoesNotMatch:"*"} : {etagMatches:match.slice(1,-1)};
      const record = await env.BUCKET.put(key,JSON.stringify(content),{onlyIf:condition});
      if (!record) return reply(412);
      headers.ETag = record.httpEtag;
      return reply(204);
    } catch { return reply(503); }
  }
};
