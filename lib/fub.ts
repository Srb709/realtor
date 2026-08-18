const FUB_BASE_URL = "https://api.followupboss.com/v1";

function getApiKey() {
  const key = process.env.FUB_API_KEY;
  if (!key) throw new Error("FUB_API_KEY is not configured");
  return key;
}

function authHeader() {
  return `Basic ${Buffer.from(`${getApiKey()}:`).toString("base64")}`;
}

export async function fubGet<T>(path: string): Promise<T> {
  const response = await fetch(`${FUB_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: authHeader(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Follow Up Boss request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function fubPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${FUB_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Follow Up Boss update failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export type FubPerson = {
  id?: number;
  firstName?: string;
  lastName?: string;
  stage?: string;
  source?: string;
  tags?: string[];
  emails?: Array<{ value?: string; type?: string }>;
  phones?: Array<{ value?: string; type?: string }>;
  [key: string]: unknown;
};

export type FubPeopleResponse = {
  people?: FubPerson[];
  _metadata?: Record<string, unknown>;
};

export async function getFubPeople(limit = 10) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  return fubGet<FubPeopleResponse>(`/people?limit=${safeLimit}`);
}

export async function mergeFubTag(personId: number | string, tag: string) {
  return fubPut<FubPerson>(`/people/${encodeURIComponent(String(personId))}?mergeTags=true`, {
    tags: [tag],
  });
}
