export class SignJWT {
  private payload: Record<string, unknown> = {};
  private _alg = "HS256";

  setProtectedHeader() { return this; }
  setIssuedAt() { return this; }
  setExpirationTime() { return this; }
  setSubject() { return this; }

  async sign(_key: unknown): Promise<string> {
    return Buffer.from(JSON.stringify(this.payload)).toString("base64") + ".sig";
  }
}

export async function jwtVerify(_token: string, _key: unknown) {
  return { payload: { sub: "test-user", email: "test@test.com" } };
}
