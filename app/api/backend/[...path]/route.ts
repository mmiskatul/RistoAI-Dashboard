import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const BACKEND_REQUEST_TIMEOUT_MS = 15_000;

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const getBackendApiBaseUrl = (): string => {
  const configured = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!configured.trim()) {
    throw new Error("API_BASE_URL is not configured");
  }

  return normalizeBaseUrl(configured);
};

const createForwardHeaders = (request: NextRequest): Headers => {
  const headers = new Headers(request.headers);

  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));
  headers.delete("host");

  return headers;
};

const createResponseHeaders = (headers: Headers): Headers => {
  const responseHeaders = new Headers(headers);

  HOP_BY_HOP_HEADERS.forEach((header) => responseHeaders.delete(header));

  return responseHeaders;
};

const forwardToBackend = async (request: NextRequest, context: RouteContext) => {
  const { path = [] } = await context.params;
  const requestUrl = new URL(request.url);
  const backendUrl = new URL(path.join("/"), `${getBackendApiBaseUrl()}/`);
  backendUrl.search = requestUrl.search;

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const backendResponse = await fetch(backendUrl, {
      method,
      headers: createForwardHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(BACKEND_REQUEST_TIMEOUT_MS),
    });

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: createResponseHeaders(backendResponse.headers),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown backend connection error";

    return Response.json(
      {
        message: "Unable to reach the API server",
        detail,
      },
      { status: 502 }
    );
  }
};

export const GET = forwardToBackend;
export const POST = forwardToBackend;
export const PUT = forwardToBackend;
export const PATCH = forwardToBackend;
export const DELETE = forwardToBackend;
