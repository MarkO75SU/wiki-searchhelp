# WikiGUI Security Documentation

## 🔒 Hardened Data Flow (Current)
The application has been secured by removing sensitive API keys from the frontend and utilizing **Supabase Edge Functions** as a secure proxy.

### Data Flow Diagram:
`Browser (Client)` -> `Supabase Edge Function (get-embeddings)` -> `Google Gemini API`

### Detailed Steps:
1.  **Request Initiation:** The client application (Browser) identifies articles requiring semantic analysis.
2.  **Secure Proxy Call:** Instead of contacting Google directly, the app calls the Supabase Edge Function `get-embeddings` via the Supabase Client SDK.
3.  **Authentication (Implicit):** The call uses the Supabase Anon Key.
4.  **Secrets Management:** The Edge Function retrieves the `GEMINI_API_KEY` from Supabase's internal environment variables (Server-side). This key is **never** sent to the client.
5.  **External API Call:** The Edge Function performs a server-to-server request to the Google Gemini API (`batchEmbedContents`).
6.  **Response Handling:** The Edge Function receives the raw embeddings, parses them, and returns only the necessary vector data back to the client.

### Benefits
- **Zero Exposure:** The Gemini API key is completely hidden from the public.
- **Quota Control:** Requests can be monitored and limited at the Edge Function level.
- **CORS Management:** Securely handled by the Edge Function.

---
*Last Updated: 2026-01-18*