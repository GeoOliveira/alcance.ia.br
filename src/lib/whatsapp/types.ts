export type NormalizedBrazilianPhone = {
  countryCode: "55";
  areaCode: string;
  localNumber: string;
  internationalNumber: string;
  formattedNational: string;
  isMobile: boolean;
};

export type WhatsAppGeneratorFlags = {
  customMessage: boolean;
  copy: boolean;
  open: boolean;
  share: boolean;
  shortener: boolean;
  shortenerShare: boolean;
};
