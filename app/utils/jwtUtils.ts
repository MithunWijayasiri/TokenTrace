/**
 * Decodes a base64url encoded string
 */
export function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
        }
        base64 += new Array(5 - pad).join('=');
    }
    return atob(base64);
}

/**
 * Encodes a string as base64url
 */
export function base64UrlEncode(str: string): string {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Attempts to decode and parse a JWT token part
 */
export function tryDecodeAndParse(part: string | undefined): object | null | string {
    if (!part) return null;
    try {
        const decoded = base64UrlDecode(part);
        try {
            return JSON.parse(decoded);
        } catch (jsonError) {
            return decoded; // Return as string if not JSON
        }
    } catch (e) {
        console.error("Failed to decode/parse part:", e);
        return null;
    }
}

/**
 * Converts a string to an ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

/**
 * Converts a binary string to ArrayBuffer
 */
function binaryStringToArrayBuffer(binaryStr: string): ArrayBuffer {
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Verifies a JWT signature
 */
export async function verifySignature(
    token: string, 
    secret: string, 
    isBase64Encoded: boolean = false
): Promise<{ isValid: boolean; algorithm: string | null; error: string | null }> {
    try {
        // Split the token
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { 
                isValid: false, 
                algorithm: null, 
                error: 'Invalid token format: Token must have 3 parts.' 
            };
        }

        const [headerB64, payloadB64, signatureB64] = parts;
        const signedData = `${headerB64}.${payloadB64}`;

        // Decode header to get algorithm
        const headerObj = tryDecodeAndParse(headerB64);
        if (!headerObj || typeof headerObj !== 'object') {
            return { 
                isValid: false, 
                algorithm: null, 
                error: 'Invalid header format' 
            };
        }
        
        // Extract algorithm
        const header = headerObj as any;
        const algorithm = header.alg;
        
        if (!algorithm) {
            return { 
                isValid: false, 
                algorithm: null, 
                error: 'Algorithm not specified in token header' 
            };
        }
        
        // Signature from token
        const signatureBytes = new Uint8Array(
            Array.from(base64UrlDecode(signatureB64))
                .map(c => c.charCodeAt(0))
        );

        // Handle different algorithms
        if (algorithm === 'HS256') {
            // HMAC SHA-256
            let keyData: ArrayBuffer;
            
            if (isBase64Encoded) {
                try {
                    // Decode base64 to get the actual key bytes
                    const keyBinary = atob(secret);
                    keyData = binaryStringToArrayBuffer(keyBinary);
                } catch (e) {
                    return { 
                        isValid: false, 
                        algorithm: 'HS256', 
                        error: 'Invalid base64 secret key' 
                    };
                }
            } else {
                // Use raw secret string as UTF-8 bytes
                keyData = stringToArrayBuffer(secret);
            }

            // Import the key
            const key = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: { name: 'SHA-256' } },
                false,
                ['verify']
            );

            // Verify signature
            const isValid = await crypto.subtle.verify(
                'HMAC',
                key,
                signatureBytes,
                stringToArrayBuffer(signedData)
            );

            return { 
                isValid, 
                algorithm: 'HS256', 
                error: null 
            };
        } 
        else if (algorithm === 'RS256') {
            try {
                // For RS256, the secret is actually a public key in PEM format
                // First strip PEM headers and decode base64
                let pemContent = secret;
                
                // Make sure it's a proper PEM format if not already
                if (!pemContent.includes('-----BEGIN PUBLIC KEY-----')) {
                    if (isBase64Encoded) {
                        try {
                            pemContent = atob(secret);
                        } catch (e) {
                            // If it's not valid base64, we'll try to use it as is
                        }
                    }
                    
                    // If still doesn't have PEM header, try to add them
                    if (!pemContent.includes('-----BEGIN PUBLIC KEY-----')) {
                        pemContent = `-----BEGIN PUBLIC KEY-----\n${pemContent.replace(/(.{64})/g, '$1\n')}\n-----END PUBLIC KEY-----`;
                    }
                }
                
                // Remove headers and line breaks
                const keyB64 = pemContent
                    .replace('-----BEGIN PUBLIC KEY-----', '')
                    .replace('-----END PUBLIC KEY-----', '')
                    .replace(/\s+/g, '');
                
                // Convert base64 to binary
                const keyBinary = atob(keyB64);
                const keyData = binaryStringToArrayBuffer(keyBinary);
                
                // Import the RSA public key
                const publicKey = await crypto.subtle.importKey(
                    'spki',
                    keyData,
                    {
                        name: 'RSASSA-PKCS1-v1_5',
                        hash: { name: 'SHA-256' },
                    },
                    false,
                    ['verify']
                );
                
                // Verify signature
                const isValid = await crypto.subtle.verify(
                    'RSASSA-PKCS1-v1_5',
                    publicKey,
                    signatureBytes,
                    stringToArrayBuffer(signedData)
                );
                
                return { 
                    isValid, 
                    algorithm: 'RS256', 
                    error: null 
                };
            } catch (error) {
                return { 
                    isValid: false, 
                    algorithm: 'RS256', 
                    error: `RSA verification error: ${error instanceof Error ? error.message : String(error)}` 
                };
            }
        } 
        else {
            return { 
                isValid: false, 
                algorithm, 
                error: `Algorithm '${algorithm}' not supported. Only HS256 and RS256 are supported.` 
            };
        }
    } catch (error) {
        return { 
            isValid: false, 
            algorithm: null, 
            error: `Signature verification error: ${error instanceof Error ? error.message : String(error)}` 
        };
    }
} 