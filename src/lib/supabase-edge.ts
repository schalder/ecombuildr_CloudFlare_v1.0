// Helper constants and utilities for calling Supabase edge functions
export const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

/**
 * Call a Supabase edge function with proper authentication headers
 * @param functionName - Name of the edge function (e.g., 'send-facebook-event')
 * @param body - Request body to send
 * @returns Promise with the response JSON
 */
export async function callEdgeFunction(functionName: string, body: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Edge function ${functionName} failed: ${response.status} ${JSON.stringify(errorData)}`);
  }
  
  return response.json();
}
