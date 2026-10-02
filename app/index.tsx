import { Redirect } from 'expo-router';

/**
 * Root entry point for WidgeBuddy.
 * Redirects the initial widgebuddy:/// deep link / launch URL to the main dashboard.
 */
export default function Index() {
  return <Redirect href="/dashboard" />;
}
