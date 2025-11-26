/**
 * Service to lookup Japanese addresses from postal codes using ZipCloud API
 * API: https://zipcloud.ibsnet.co.jp/doc/api
 */

interface ZipCloudResult {
  zipcode: string;
  prefcode: string;
  address1: string; // Prefecture (都道府県)
  address2: string; // City/Ward (市区町村)
  address3: string; // District/Town (町・丁目)
  kana1: string;
  kana2: string;
  kana3: string;
}

interface ZipCloudResponse {
  message: string | null;
  results: ZipCloudResult[] | null;
  status: number;
}

export interface AddressLookupResult {
  prefecture: string;
  city: string;
  district: string;
}

/**
 * Lookup address from Japanese postal code (7 digits)
 * @param postalCode - 7-digit postal code (with or without hyphen)
 * @returns Address information or null if not found
 */
export const lookupAddressByPostalCode = async (
  postalCode: string
): Promise<AddressLookupResult | null> => {
  // Remove hyphen and ensure 7 digits
  const cleanCode = postalCode.replace(/\D/g, '');
  if (cleanCode.length !== 7) {
    return null;
  }

  try {
    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanCode}`);
    const data: ZipCloudResponse = await response.json();

    if (data.status !== 200 || !data.results || data.results.length === 0) {
      return null;
    }

    // Use the first result (most common case)
    const result = data.results[0];
    return {
      prefecture: result.address1,
      city: result.address2,
      district: result.address3,
    };
  } catch (error) {
    console.error('Failed to lookup address:', error);
    return null;
  }
};

