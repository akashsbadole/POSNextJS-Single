export class NextRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly cookies: Map<string, string>;
  readonly nextUrl: URL;
  private body: unknown;
  private searchParams: URLSearchParams;

  constructor(url: string, init?: RequestInit & { body?: unknown }) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.method = init?.method || "GET";
    this.headers = new Headers(init?.headers);
    this.cookies = new Map();
    this.body = init?.body;
    this.searchParams = this.nextUrl.searchParams;
  }

  async json<T = Record<string, unknown>>(): Promise<T> {
    return (typeof this.body === "string" ? JSON.parse(this.body) : this.body) as T;
  }

  async text(): Promise<string> {
    return String(this.body || "");
  }
}

class _NextResponse {
  readonly status: number;
  readonly headers: Headers;
  private body: string | null;

  constructor(body: string | null, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
  }

  static json(body: unknown, init?: ResponseInit): _NextResponse {
    return new _NextResponse(JSON.stringify(body), {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  }

  static redirect(url: string, status?: number): _NextResponse {
    return new _NextResponse(null, { status: status || 307, headers: { Location: url } });
  }

  static next(): _NextResponse {
    return new _NextResponse(null, { status: 200 });
  }

  async json<T = unknown>(): Promise<T> {
    return JSON.parse(this.body || "null") as T;
  }

  async text(): Promise<string> {
    return this.body || "";
  }
}

export { _NextResponse as NextResponse };
