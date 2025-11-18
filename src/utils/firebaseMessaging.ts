// Firebase messaging was removed. Export no-op functions so existing imports
// don't break the build while removing Firebase from the project.
export async function solicitarPermisoYToken(): Promise<null> {
  // No-op: Firebase removed
  return null;
}

export function escucharMensajes(): void {
  // No-op: Firebase removed
}
