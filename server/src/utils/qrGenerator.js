import QRCode from 'qrcode';

/**
 * Generate a QR code as a Base64 Data URL.
 * The QR payload is a JSON string containing the identifier and type.
 *
 * @param {string} identifier - The unique ID to encode (bookId, studentId, etc.)
 * @param {string} type - The type of QR code ('BOOK' or 'STUDENT')
 * @returns {Promise<string>} Base64-encoded PNG data URL of the QR code
 */
export const generateQRCode = async (identifier, type = 'BOOK') => {
  const payload = JSON.stringify({
    id: identifier,
    type: type,
    timestamp: Date.now(),
  });

  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });

  return qrDataUrl;
};

/**
 * Parse a scanned QR code payload string.
 *
 * @param {string} rawData - The raw string from the QR scanner
 * @returns {{ id: string, type: string, timestamp: number } | null}
 */
export const parseQRPayload = (rawData) => {
  try {
    const parsed = JSON.parse(rawData);
    if (parsed.id && parsed.type) {
      return parsed;
    }
    return null;
  } catch {
    // If the QR just contains a plain book ID string (not JSON), wrap it
    if (typeof rawData === 'string' && rawData.trim().length > 0) {
      return { id: rawData.trim(), type: 'BOOK', timestamp: 0 };
    }
    return null;
  }
};

export default { generateQRCode, parseQRPayload };
