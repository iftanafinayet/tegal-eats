export async function dataRequest<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch("/api/data", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Permintaan data gagal.");
  return body.data as T;
}
