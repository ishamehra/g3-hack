export const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  isDemoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
} as const;
