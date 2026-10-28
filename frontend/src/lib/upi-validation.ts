export interface UpiValidationResult {
  isValid: boolean;
  error?: string;
  cleanUpi?: string;
  normalizedUpi?: string;
}

export const RECOGNIZED_UPI_HANDLES = new Set<string>([
  // Google Pay
  "okhdfcbank",
  "okaxis",
  "okicici",
  "oksbi",
  // PhonePe
  "ybl",
  "ibl",
  "axl",
  // Paytm
  "paytm",
  // BHIM / NPCI
  "upi",
  "npci",
  // Amazon Pay
  "apl",
  "rapl",
  // WhatsApp Pay
  "waaxis",
  "wahdfc",
  "waicici",
  "wasbi",
  // Major & Nationalized Indian Banks
  "sbi",
  "hdfcbank",
  "icici",
  "axisbank",
  "kotak",
  "indus",
  "idfcbank",
  "federal",
  "barodampay",
  "aubank",
  "rbl",
  "pnb",
  "boi",
  "canarabank",
  "cnrb",
  "unionbank",
  "iob",
  "uco",
  "cboi",
  "sc",
  "scb",
  "dbs",
  "hsbc",
  "equitas",
  "bandhan",
  "psb",
  "idbi",
  "sib",
  "kvb",
  "karurvysyabank",
  "tjsb",
  "cosmobank",
  "fbl",
  "yesbank",
  "payzapp",
  "abfspay",
  "timepay",
  "mobikwik",
  "freecharge",
  "airtel",
  "airtelpaymentsbank",
  "jio",
  "jiopay",
  "jupiteraxis",
  "sliceaxis",
  "fi",
  "cred",
  "postbank",
  "ippb",
  "payworld",
  "spay",
  "finobank",
  "nsdl",
  "shivalik",
  "utkarsh",
  "janabank",
  "esaf",
  "suryoday",
  "capitalbank",
  "dcb",
  "kbl",
  "svc",
  "bhamashah",
  "mahb",
  "citi",
  "citigold",
  "dlb",
  "allbank",
  "corp",
  "syndicate",
  "vijayabank",
  "united",
  "andhrabank",
  "allahabad",
  "orientalbank",
  "obc",
  "centralbank",
  "bankofbaroda",
  "bob",
  "pnbbank",
  "indianbank",
  "indianbk",
  "idbibank",
  "punjabbank",
  "canara",
  "axis",
  "hdfc",
  "union",
]);

export function validateUpiId(rawUpi: string | null | undefined): UpiValidationResult {
  if (rawUpi === undefined || rawUpi === null) {
    return {
      isValid: false,
      error: "Please enter your business UPI ID.",
    };
  }

  const cleanUpi = String(rawUpi).trim();

  if (!cleanUpi) {
    return {
      isValid: false,
      error: "Please enter your business UPI ID.",
    };
  }

  if (cleanUpi.length < 5) {
    return {
      isValid: false,
      error: "UPI ID must be at least 5 characters long (e.g. yourname@upi).",
      cleanUpi,
    };
  }

  if (cleanUpi.length > 50) {
    return {
      isValid: false,
      error: "UPI ID cannot exceed 50 characters.",
      cleanUpi,
    };
  }

  const parts = cleanUpi.split("@");
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: "UPI ID must contain exactly one '@' symbol (e.g. cloudbites@okhdfcbank or 9876543210@paytm).",
      cleanUpi,
    };
  }

  const [username, handle] = parts;

  if (!username || username.length < 2 || username.length > 30) {
    return {
      isValid: false,
      error: "Username before '@' must be between 2 and 30 characters.",
      cleanUpi,
    };
  }

  // Username must consist of alphanumeric characters, dots, hyphens, or underscores, and not start/end with dot/hyphen/underscore
  const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9.\-_]*[a-zA-Z0-9])?$/;
  if (!usernameRegex.test(username) || username.includes("..") || username.includes("--") || username.includes("__")) {
    return {
      isValid: false,
      error: "Username contains invalid characters or consecutive symbols. Use only letters, numbers, dots, hyphens, or underscores.",
      cleanUpi,
    };
  }

  if (!handle || handle.length < 2 || handle.length > 25) {
    return {
      isValid: false,
      error: "UPI handle after '@' must be between 2 and 25 characters.",
      cleanUpi,
    };
  }

  const handleRegex = /^[a-zA-Z0-9]+$/;
  if (!handleRegex.test(handle)) {
    return {
      isValid: false,
      error: "UPI handle after '@' must contain only letters and numbers without symbols.",
      cleanUpi,
    };
  }

  const lowerHandle = handle.toLowerCase();
  if (!RECOGNIZED_UPI_HANDLES.has(lowerHandle)) {
    return {
      isValid: false,
      error: `Invalid UPI handle '@${handle}'. Please use a recognized bank handle (e.g. @okhdfcbank, @paytm, @ybl, @upi, @okaxis, @icici, @sbi).`,
      cleanUpi,
    };
  }

  const normalizedUpi = `${username.toLowerCase()}@${lowerHandle}`;

  return {
    isValid: true,
    cleanUpi,
    normalizedUpi,
  };
}
