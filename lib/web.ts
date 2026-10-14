import * as WebBrowser from 'expo-web-browser'
import { getToken, PRODUCTION_API_HOST } from '@/lib/api'

export const GOLFER_WEB = 'https://www.teeflx.com'

/**
 * Opens a golfer web page in the in-app browser, already logged in: the API mints a
 * one-time handoff token from the golfer's stored DGU token, and golfer web swaps it
 * for its login cookie. Without a token the page opens and asks the golfer to log in.
 * The app has no payments of its own, so buying happens on golfer web.
 */
export async function openGolferWeb(path: string): Promise<void> {
  let url = `${GOLFER_WEB}${path}`
  try {
    const token = await getToken()
    if (token) {
      // Always the production API: golfer web exchanges the token there
      const res = await fetch(`${PRODUCTION_API_HOST}/oauth/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const { handoffToken } = await res.json() as { handoffToken: string }
        url += `${path.includes('?') ? '&' : '?'}handoff=${handoffToken}`
      }
    }
  } catch {
    // No handoff: the page asks the golfer to log in
  }
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
  })
}
