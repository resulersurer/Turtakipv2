import countries from "i18n-iso-countries";
import trLocale from "i18n-iso-countries/langs/tr.json";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(trLocale);
countries.registerLocale(enLocale);

const aliases: Record<string, string> = {
  "güney kore": "KR", "kuzey kore": "KP", "amerika": "US", "abd": "US",
  "amerika birleşik devletleri": "US", "ingiltere": "GB", "birleşik krallık": "GB",
  "birleşik arap emirlikleri": "AE", "bae": "AE", "çekya": "CZ",
};

export function CountryName({ name }: { name: string }) {
  const normalized = name.trim();
  const code = aliases[normalized.toLocaleLowerCase("tr-TR")]
    || countries.getAlpha2Code(normalized, "tr")
    || countries.getAlpha2Code(normalized, "en")
    || (normalized.length === 2 && countries.isValid(normalized.toUpperCase()) ? normalized.toUpperCase() : undefined);

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {code ? <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="" aria-hidden="true" width={18} height={12} loading="lazy" className="inline-block h-3 w-[18px] shrink-0 rounded-[2px] object-cover" /> : null}
      <span>{name}</span>
    </span>
  );
}
