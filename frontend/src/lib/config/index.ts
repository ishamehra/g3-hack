export const config = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://wvhdixzdfskwtuibuudz.supabase.co",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aGRpeHpkZnNrd3R1aWJ1dWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTczNjYsImV4cCI6MjA4Nzg3MzM2Nn0.n3j4Iiv9chwGh2FhvlOi-Yt8kAGb-x8ZaoxM6sNhmnw",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws",
} as const;
