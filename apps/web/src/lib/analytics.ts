import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let isInitialized = false;

export function initPostHog() {
  if (typeof window !== 'undefined' && POSTHOG_KEY && !isInitialized) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false, // Privacy-conscious: explicit event capture only
      capture_pageview: true,
      capture_pageleave: true,
      sanitize_properties: (properties) => {
        // Redact any password or credential properties before telemetry dispatch
        const clean = { ...properties };
        delete clean.password;
        delete clean.token;
        delete clean.auth;
        return clean;
      },
    });
    isInitialized = true;
  }
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
  sessionId?: string
) {
  if (typeof window === 'undefined') return;

  // 1. Send to PostHog client if initialized
  if (isInitialized) {
    posthog.capture(eventName, properties);
  }

  // 2. Also log to internal backend telemetry endpoint for reproducible DB analytics
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  try {
    fetch(`${API_BASE}/user/telemetry/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        session_id: sessionId || 'browser_client_session',
        properties: properties || {},
      }),
    }).catch(() => {
      // Non-blocking telemetry fallback
    });
  } catch (err) {
    // Silent catch
  }
}
