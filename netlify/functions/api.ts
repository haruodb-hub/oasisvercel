import { createServer } from "../../server";

const app = createServer();

// Netlify serverless function handler
export default async (req: any, context: any) => {
  return new Promise((resolve) => {
    try {
      // Parse request body if it exists
      let body = "";
      if (req.body) {
        body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      }

      // Collect response chunks
      const responseChunks: Buffer[] = [];

      // Create Express-compatible request
      const expressReq = {
        method: req.httpMethod || "GET",
        url: req.rawUrl || req.path || "/",
        headers: req.headers || {},
        body: body ? (typeof body === "string" ? (() => { try { return JSON.parse(body); } catch { return body; } })() : body) : {},
        query: req.queryStringParameters || {},
        params: {},
        rawBody: body,
        on: (event: string, handler: Function) => {
          if (event === "data" && body) handler(Buffer.from(body));
          if (event === "end") handler();
        },
        once: (event: string, handler: Function) => {
          if (event === "end") handler();
        },
      };

      // Create Express-compatible response
      const expressRes = {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        statusMessage: "OK",
        
        write: (chunk: any) => {
          responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return true;
        },

        end: (chunk?: any) => {
          if (chunk) {
            responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const body = Buffer.concat(responseChunks).toString("utf-8");
          resolve({
            statusCode: expressRes.statusCode,
            headers: expressRes.headers,
            body: body || "",
          });
        },

        json: (data: any) => {
          expressRes.setHeader("Content-Type", "application/json");
          expressRes.end(JSON.stringify(data));
        },

        status: (code: number) => {
          expressRes.statusCode = code;
          return expressRes;
        },

        setHeader: (name: string, value: string) => {
          expressRes.headers[name.toLowerCase()] = value;
          return expressRes;
        },

        send: (data: any) => {
          if (typeof data === "object") {
            expressRes.json(data);
          } else {
            expressRes.end(data);
          }
        },
      };

      // Call Express app
      app(expressReq as any, expressRes as any, (err: any) => {
        if (err) {
          console.error("API Handler Error:", err);
          expressRes.statusCode = 500;
          expressRes.json({ error: "Internal Server Error", message: err.message });
        }
      });
    } catch (error: any) {
      console.error("Netlify Function Error:", error);
      resolve({
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
      });
    }
  });
};
