import { AdminAccountError } from "./admin-accounts";

export function adminAccountErrorResponse(error: unknown) {
  if (error instanceof AdminAccountError) {
    const status = {
      validation: 400,
      conflict: 409,
      "not-found": 404,
      forbidden: 403,
    }[error.code];
    return Response.json(
      { error: error.message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error("Admin account storage is unavailable.");
  return Response.json(
    { error: "Account changes are temporarily unavailable. Please try again." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
