"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { LyriaParamsRow } from "@/types";

export function useLyriaParams(sessionId: string | null) {
  const [params, setParams] = useState<LyriaParamsRow | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setParams(null);
      return;
    }

    // Fetch initial state
    supabase
      .from("lyria_params")
      .select("*")
      .eq("session_id", sessionId)
      .single()
      .then(({ data }) => {
        if (data) setParams(data as LyriaParamsRow);
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`lyria_params:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lyria_params",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setParams(payload.new as LyriaParamsRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return params;
}
