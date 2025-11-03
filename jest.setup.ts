// Ensure test environment has minimal env vars required by client initializers
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon-key";

// Provide minimal firebase envs used by firebaseClient to avoid undefined assertions during import
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "fake-api-key";
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fake-auth-domain";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fake-project";
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789";
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123:web:abc";
process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "fake-vapid-key";

import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import "whatwg-fetch";

// Minimal firebase mocks to avoid `unsupported-browser` errors when tests import firebase/messaging
// These provide the basic functions used by our firebase utilities without requiring a browser.
try {
	// Provide a lightweight Notification polyfill for tests (requestPermission + constructor)
	// so `solicitarPermisoYToken` and `new Notification(...)` don't crash in Node/jsdom.
	class MockNotification {
		title: string;
		body?: string;
		constructor(title: string, options?: { body?: string }) {
			this.title = title;
			this.body = options?.body;
		}
		static async requestPermission() {
			// default to 'denied' to avoid calling getToken during tests
			return "denied";
		}
	}
	(global as any).Notification = MockNotification;

	// jest is available in the setup environment
	jest.mock("firebase/messaging", () => ({
		__esModule: true,
		getMessaging: jest.fn(() => ({})),
		getToken: jest.fn(async () => null),
		onMessage: jest.fn(() => () => {}),
	}));

	// Ensure the firebase/app mock includes getApps so code calling getApps().length works
	jest.mock("firebase/app", () => ({
		__esModule: true,
		initializeApp: jest.fn((config) => ({ name: (config && config.projectId) || "[DEFAULT]" })),
		getApp: jest.fn(() => ({ name: "[MOCK_APP]" })),
		getApps: jest.fn(() => []),
	}));
} catch (e) {
	// If jest.mock isn't available here for some reason, continue silently — tests will fail later and show the reason.
}