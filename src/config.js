// src/config.js

// Seu ID de projeto extraído: qkgyeavcadbbwomagevr
const SUPABASE_URL = "https://qkgyeavcadbbwomagevr.supabase.co";

// Sua chave (que você acabou de colar)
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZ3llYXZjYWRiYndvbWFnZXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTY0NDEsImV4cCI6MjA4MTEzMjQ0MX0.yYHkWicKdjB2jm8h6xIjcfIbGanVDvWNIfifLrGJxpU";

// Inicializa a conexão com o banco
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);