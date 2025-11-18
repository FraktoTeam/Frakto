// Firebase was removed project-wide. Keep a minimal stub so any lingering imports
// don't crash the test/build during removal. If you see this called at runtime,
// remove the import or reintroduce Firebase initialization.
export function getFirebaseApp(): never {
  throw new Error(
    "Firebase has been removed from the project. Remove imports to getFirebaseApp or re-add Firebase."
  );
}
