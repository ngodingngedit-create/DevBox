// Lightweight pure-JS MD5 implementation (Web Crypto does not support MD5)
function md5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  function F(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function H(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function I(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  const utf8 = new TextEncoder().encode(string);
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= utf8[i] << ((i % 4) * 8);
  }

  const bitLen = utf8.length * 8;
  words[bitLen >> 5] |= 0x80 << (bitLen % 32);
  words[(((bitLen + 64) >>> 9) << 4) + 14] = bitLen;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const AA = a;
    const BB = b;
    const CC = c;
    const DD = d;

    a = FF(a, b, c, d, words[i + 0] || 0, 7, -680876936);
    d = FF(d, a, b, c, words[i + 1] || 0, 12, -389564586);
    c = FF(c, d, a, b, words[i + 2] || 0, 17, 606105819);
    b = FF(b, c, d, a, words[i + 3] || 0, 22, -1044525330);
    a = FF(a, b, c, d, words[i + 4] || 0, 7, -176418897);
    d = FF(d, a, b, c, words[i + 5] || 0, 12, 1200080426);
    c = FF(c, d, a, b, words[i + 6] || 0, 17, -1473231341);
    b = FF(b, c, d, a, words[i + 7] || 0, 22, -45705983);
    a = FF(a, b, c, d, words[i + 8] || 0, 7, 1770035416);
    d = FF(d, a, b, c, words[i + 9] || 0, 12, -1958414417);
    c = FF(c, d, a, b, words[i + 10] || 0, 17, -42063);
    b = FF(b, c, d, a, words[i + 11] || 0, 22, -1990404162);
    a = FF(a, b, c, d, words[i + 12] || 0, 7, 1804603682);
    d = FF(d, a, b, c, words[i + 13] || 0, 12, -40341101);
    c = FF(c, d, a, b, words[i + 14] || 0, 17, -1502002290);
    b = FF(b, c, d, a, words[i + 15] || 0, 22, 1236535329);

    a = GG(a, b, c, d, words[i + 1] || 0, 5, -165796510);
    d = GG(d, a, b, c, words[i + 6] || 0, 9, -1069501632);
    c = GG(c, d, a, b, words[i + 11] || 0, 14, 643717713);
    b = GG(b, c, d, a, words[i + 0] || 0, 20, -373897302);
    a = GG(a, b, c, d, words[i + 5] || 0, 5, -701558691);
    d = GG(d, a, b, c, words[i + 10] || 0, 9, 38016083);
    c = GG(c, d, a, b, words[i + 15] || 0, 14, -660478335);
    b = GG(b, c, d, a, words[i + 4] || 0, 20, -405537848);
    a = GG(a, b, c, d, words[i + 9] || 0, 5, 568446438);
    d = GG(d, a, b, c, words[i + 14] || 0, 9, -1019803690);
    c = GG(c, d, a, b, words[i + 3] || 0, 14, -187363961);
    b = GG(b, c, d, a, words[i + 8] || 0, 20, 1163531501);
    a = GG(a, b, c, d, words[i + 13] || 0, 5, -1444681467);
    d = GG(d, a, b, c, words[i + 2] || 0, 9, -51403784);
    c = GG(c, d, a, b, words[i + 7] || 0, 14, 1735328473);
    b = GG(b, c, d, a, words[i + 12] || 0, 20, -1926607734);

    a = HH(a, b, c, d, words[i + 5] || 0, 4, -378558);
    d = HH(d, a, b, c, words[i + 8] || 0, 11, -2022574463);
    c = HH(c, d, a, b, words[i + 11] || 0, 16, 1839030562);
    b = HH(b, c, d, a, words[i + 14] || 0, 23, -35309556);
    a = HH(a, b, c, d, words[i + 1] || 0, 4, -1530992060);
    d = HH(d, a, b, c, words[i + 4] || 0, 11, 1272893353);
    c = HH(c, d, a, b, words[i + 7] || 0, 16, -155497632);
    b = HH(b, c, d, a, words[i + 10] || 0, 23, -1094730640);
    a = HH(a, b, c, d, words[i + 13] || 0, 4, 681279174);
    d = HH(d, a, b, c, words[i + 0] || 0, 11, -358537222);
    c = HH(c, d, a, b, words[i + 3] || 0, 16, -722521979);
    b = HH(b, c, d, a, words[i + 6] || 0, 23, 76029189);
    a = HH(a, b, c, d, words[i + 9] || 0, 4, -640364487);
    d = HH(d, a, b, c, words[i + 12] || 0, 11, -421815835);
    c = HH(c, d, a, b, words[i + 15] || 0, 16, 530742520);
    b = HH(b, c, d, a, words[i + 2] || 0, 23, -995338651);

    a = II(a, b, c, d, words[i + 0] || 0, 6, -198630844);
    d = II(d, a, b, c, words[i + 7] || 0, 10, 1126891415);
    c = II(c, d, a, b, words[i + 14] || 0, 15, -1416354905);
    b = II(b, c, d, a, words[i + 5] || 0, 21, -57434055);
    a = II(a, b, c, d, words[i + 12] || 0, 6, 1700485571);
    d = II(d, a, b, c, words[i + 3] || 0, 10, -1894986606);
    c = II(c, d, a, b, words[i + 10] || 0, 15, -1051523);
    b = II(b, c, d, a, words[i + 1] || 0, 21, -2054922799);
    a = II(a, b, c, d, words[i + 8] || 0, 6, 1873313359);
    d = II(d, a, b, c, words[i + 15] || 0, 10, -30611744);
    c = II(c, d, a, b, words[i + 6] || 0, 15, -1560198380);
    b = II(b, c, d, a, words[i + 13] || 0, 21, 1309151649);
    a = II(a, b, c, d, words[i + 4] || 0, 6, -145523070);
    d = II(d, a, b, c, words[i + 11] || 0, 10, -1120210379);
    c = II(c, d, a, b, words[i + 2] || 0, 15, 718787259);
    b = II(b, c, d, a, words[i + 9] || 0, 21, -343485551);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  function wordToHex(lValue: number) {
    let wordToHexValue = '';
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const hex = lByte.toString(16).padStart(2, '0');
      wordToHexValue += hex;
    }
    return wordToHexValue;
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

async function webCryptoHash(algorithm: 'SHA-1' | 'SHA-256', text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface HashOutputs {
  md5: string;
  sha1: string;
  sha256: string;
}

export async function computeHashes(input: string, uppercase = false): Promise<HashOutputs> {
  if (!input) {
    return { md5: '', sha1: '', sha256: '' };
  }

  const [sha1Res, sha256Res] = await Promise.all([
    webCryptoHash('SHA-1', input),
    webCryptoHash('SHA-256', input),
  ]);
  const md5Res = md5(input);

  return {
    md5: uppercase ? md5Res.toUpperCase() : md5Res.toLowerCase(),
    sha1: uppercase ? sha1Res.toUpperCase() : sha1Res.toLowerCase(),
    sha256: uppercase ? sha256Res.toUpperCase() : sha256Res.toLowerCase(),
  };
}
