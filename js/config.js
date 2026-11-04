/* ==========================================================================
   Медкорпус Конохи — настройки облачной синхронизации
   --------------------------------------------------------------------------
   Состав и аккаунты общие для всех браузеров и устройств через Supabase.

   Supabase Dashboard → Project Settings → API:
     • Project URL      → supabaseUrl
     • publishable key  → supabaseKey

   Ключ publishable публичный, его можно хранить в коде сайта.
   Таблица создаётся скриптом supabase/schema.sql.
   ========================================================================== */
window.MC_CONFIG = {
  supabaseUrl: "https://pbawnizilzyspphnelfu.supabase.co",
  supabaseKey: "sb_publishable_nnqg2K6iTqS6yANsfkk_FA_YDsR61Ih",
  table: "medcorpus_state",
  rowId: "main",
  /* Регистрация подтверждается кодом из письма (Supabase Auth).
     Поставьте false, только если нужно вернуть регистрацию без письма. */
  emailConfirm: true
};
