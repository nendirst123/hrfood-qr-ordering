// HR FOOD Dynamic QRIS Generator (EMVCo / ASPI Specification)
// Converts static DANA Business QRIS into a dynamic QRIS with automatic transaction amount.

export const STATIC_QRIS_DANA =
  '00020101021126570011ID.DANA.WWW011893600915398555733402099855573340303UMI51440014ID.CO.QRIS.WWW0215ID10254295697710303UMI5204581253033605802ID5909Hrfood.id6010Kota Depok61051645263042AAA';

export const QRIS_MERCHANT_INFO = {
  merchantName: 'Hrfood.id',
  nmid: 'ID1025429569771',
  acquirer: 'DANA',
  city: 'Kota Depok',
  postalCode: '16452',
};

export function calculateCrc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generateDynamicQRIS(amount: number, staticQRIS: string = STATIC_QRIS_DANA): string {
  if (!amount || amount <= 0) {
    return staticQRIS;
  }

  let qris = staticQRIS.replace('010211', '010212');
  const amountStr = Math.round(amount).toString();
  const tag54 = '54' + amountStr.length.toString().padStart(2, '0') + amountStr;

  const marker = '5802ID';
  const parts = qris.split(marker);
  if (parts.length !== 2) {
    return staticQRIS;
  }

  let baseWithoutCrc = parts[0] + tag54 + marker + parts[1];
  const crcIndex = baseWithoutCrc.indexOf('6304');
  if (crcIndex !== -1) {
    baseWithoutCrc = baseWithoutCrc.substring(0, crcIndex + 4);
  } else {
    baseWithoutCrc += '6304';
  }

  const newCrc = calculateCrc16(baseWithoutCrc);
  return baseWithoutCrc + newCrc;
}
