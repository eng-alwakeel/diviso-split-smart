export interface Country {
  code: string;
  name: string;
  nameEn: string;
  dialCode: string;
  flag: string;
  region: string;
}

export const countries: Country[] = [
  // دول الخليج (الأولوية)
  { code: "SA", name: "السعودية", nameEn: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", region: "الخليج" },
  { code: "AE", name: "الإمارات", nameEn: "UAE", dialCode: "+971", flag: "🇦🇪", region: "الخليج" },
  { code: "KW", name: "الكويت", nameEn: "Kuwait", dialCode: "+965", flag: "🇰🇼", region: "الخليج" },
  { code: "BH", name: "البحرين", nameEn: "Bahrain", dialCode: "+973", flag: "🇧🇭", region: "الخليج" },
  { code: "QA", name: "قطر", nameEn: "Qatar", dialCode: "+974", flag: "🇶🇦", region: "الخليج" },
  { code: "OM", name: "عُمان", nameEn: "Oman", dialCode: "+968", flag: "🇴🇲", region: "الخليج" },
  
  // الدول العربية
  { code: "EG", name: "مصر", nameEn: "Egypt", dialCode: "+20", flag: "🇪🇬", region: "عربية" },
  { code: "JO", name: "الأردن", nameEn: "Jordan", dialCode: "+962", flag: "🇯🇴", region: "عربية" },
  { code: "LB", name: "لبنان", nameEn: "Lebanon", dialCode: "+961", flag: "🇱🇧", region: "عربية" },
  { code: "SY", name: "سوريا", nameEn: "Syria", dialCode: "+963", flag: "🇸🇾", region: "عربية" },
  { code: "IQ", name: "العراق", nameEn: "Iraq", dialCode: "+964", flag: "🇮🇶", region: "عربية" },
  { code: "YE", name: "اليمن", nameEn: "Yemen", dialCode: "+967", flag: "🇾🇪", region: "عربية" },
  { code: "PS", name: "فلسطين", nameEn: "Palestine", dialCode: "+970", flag: "🇵🇸", region: "عربية" },
  { code: "SD", name: "السودان", nameEn: "Sudan", dialCode: "+249", flag: "🇸🇩", region: "عربية" },
  { code: "LY", name: "ليبيا", nameEn: "Libya", dialCode: "+218", flag: "🇱🇾", region: "عربية" },
  { code: "TN", name: "تونس", nameEn: "Tunisia", dialCode: "+216", flag: "🇹🇳", region: "عربية" },
  { code: "DZ", name: "الجزائر", nameEn: "Algeria", dialCode: "+213", flag: "🇩🇿", region: "عربية" },
  { code: "MA", name: "المغرب", nameEn: "Morocco", dialCode: "+212", flag: "🇲🇦", region: "عربية" },
  
  // دول أخرى شائعة
  { code: "US", name: "أمريكا", nameEn: "USA", dialCode: "+1", flag: "🇺🇸", region: "أخرى" },
  { code: "GB", name: "بريطانيا", nameEn: "UK", dialCode: "+44", flag: "🇬🇧", region: "أخرى" },
  { code: "TR", name: "تركيا", nameEn: "Turkey", dialCode: "+90", flag: "🇹🇷", region: "أخرى" },
  { code: "PK", name: "باكستان", nameEn: "Pakistan", dialCode: "+92", flag: "🇵🇰", region: "أخرى" },
  { code: "IN", name: "الهند", nameEn: "India", dialCode: "+91", flag: "🇮🇳", region: "أخرى" },
  { code: "PH", name: "الفلبين", nameEn: "Philippines", dialCode: "+63", flag: "🇵🇭", region: "أخرى" },
  { code: "ID", name: "إندونيسيا", nameEn: "Indonesia", dialCode: "+62", flag: "🇮🇩", region: "أخرى" },
  { code: "MY", name: "ماليزيا", nameEn: "Malaysia", dialCode: "+60", flag: "🇲🇾", region: "أخرى" },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

export const getCountryByDialCode = (dialCode: string): Country | undefined => {
  return countries.find(c => c.dialCode === dialCode);
};

export const defaultCountry = countries[0]; // السعودية
