/**
 * Best-effort per-message language detection (id vs en) so Finny replies
 * in the language the user actually used — not just the app setting.
 * Majority vote over common function words; ties/unknown fall back
 * to the provided default (the app language).
 */

export type ChatLanguage = "id" | "en";

const ID_WORDS = new Set(
  "yang dan di ke dari untuk dengan aku kamu saya kita mereka tidak bukan bisa mau apa ini itu adalah ada juga sudah telah akan oleh pada sebagai atau tapi karena jika kalau agar supaya sangat lebih kurang tolong coba lihat kasih buat ambil kasihkan halo hai makasih tolongin dong kok sih deh aja kok".split(
    " "
  )
);

const EN_WORDS = new Set(
  "the and to of a in is you i my we they not no can what this that is are was were be have has had will would should could there here how why when where what hello hi hey thanks please show give take make show me".split(
    " "
  )
);

export function detectMessageLanguage(
  text: string,
  fallback: ChatLanguage = "id"
): ChatLanguage {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return fallback;

  let id = 0;
  let en = 0;
  for (const w of words) {
    if (ID_WORDS.has(w)) id++;
    else if (EN_WORDS.has(w)) en++;
  }
  if (id === 0 && en === 0) return fallback;
  if (id === en) return fallback;
  return id > en ? "id" : "en";
}
