// Ensure test environment has minimal env vars required by client initializers
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon-key";

import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import "whatwg-fetch";

// Provide a lightweight Notification polyfill for tests (requestPermission + constructor)
// in case some UI code checks for Notification availability.
class MockNotification {
	title: string;
	body?: string;
	constructor(title: string, options?: { body?: string }) {
		this.title = title;
		this.body = options?.body;
	}
	static async requestPermission() {
		// default to 'denied' to avoid attempting push registration during tests
		return "denied";
	}
}
(global as any).Notification = MockNotification;