"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { 
  SunIcon, MoonIcon, KeyIcon, ShieldIcon, DocumentIcon, CodeIcon,
  HeaderIcon, PayloadIcon, SignatureIcon, SecurityIcon, LightbulbIcon,
  FingerPrintIcon, PuzzleIcon, CheckBadgeIcon
} from './components/Icons';
import { tryDecodeAndParse, verifySignature } from './utils/jwtUtils';
import { SAMPLE_JWT } from './utils/constants';
import JwtExplanation from './components/JwtExplanation';

// --- Main Component ---
export default function JwtDebuggerPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [encodedToken, setEncodedToken] = useState<string>('');
    const [decodedHeader, setDecodedHeader] = useState<object | null | string>(null);
    const [decodedPayload, setDecodedPayload] = useState<object | null | string>(null);
    const [signaturePart, setSignaturePart] = useState<string | null>(null);
    const [encodedHeaderPart, setEncodedHeaderPart] = useState<string | null>(null);
    const [encodedPayloadPart, setEncodedPayloadPart] = useState<string | null>(null);
    const [encodedSignaturePart, setEncodedSignaturePart] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isTextareaFocused, setIsTextareaFocused] = useState<boolean>(false);
    const [secretKey, setSecretKey] = useState<string>('');
    const [isBase64Encoded, setIsBase64Encoded] = useState<boolean>(false);
    const [signatureVerification, setSignatureVerification] = useState<{ status: 'idle' | 'verified' | 'invalid' | 'error', message: string }>({ 
        status: 'idle', 
        message: 'Signature verification requires the secret or public key.' 
    });

    const insertSampleToken = () => {
        setEncodedToken(SAMPLE_JWT);
    };

    const clearToken = () => {
        setEncodedToken('');
    };

    useEffect(() => {
        // Check for theme preference only once on initial load
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                setTheme('dark');
                document.documentElement.classList.add('dark');
            } else {
                setTheme('light');
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        if (!encodedToken.trim()) {
            setDecodedHeader(null);
            setDecodedPayload(null);
            setSignaturePart(null);
            setEncodedHeaderPart(null);
            setEncodedPayloadPart(null);
            setEncodedSignaturePart(null);
            setError(null);
            return;
        }

        const parts = encodedToken.split('.');
        const [headerB64, payloadB64, signature] = parts;

        setEncodedHeaderPart(headerB64 || null);
        setEncodedPayloadPart(payloadB64 || null);
        setEncodedSignaturePart(signature || null);

        if (parts.length !== 3) {
            setError('Invalid JWT: Token must have 3 parts separated by dots.');
            setDecodedHeader(null);
            setDecodedPayload(null);
            setSignaturePart(null);
            return;
        }

        let headerError = false;
        let payloadError = false;

        const header = tryDecodeAndParse(headerB64);
        if (header === null && headerB64) {
            headerError = true;
        }
        setDecodedHeader(header);

        const payload = tryDecodeAndParse(payloadB64);
        if (payload === null && payloadB64) {
            payloadError = true;
        }
        setDecodedPayload(payload);

        setSignaturePart(signature);

        if (headerError || payloadError) {
            setError('Error decoding header or payload. Check token format.');
        } else {
            setError(null);
        }

        // Reset verification state when token changes
        setSignatureVerification({ 
            status: 'idle', 
            message: 'Signature verification requires the secret or public key.' 
        });

    }, [encodedToken]);

    // Verify signature when secret changes
    useEffect(() => {
        if (secretKey.trim() && encodedToken.trim()) {
            verifyJwtSignature();
        } else {
            setSignatureVerification({ 
                status: 'idle', 
                message: 'Signature verification requires the secret or public key.' 
            });
        }
    }, [secretKey, isBase64Encoded, encodedToken]);

    const verifyJwtSignature = async () => {
        if (!encodedToken || !secretKey) {
            setSignatureVerification({ 
                status: 'idle', 
                message: 'Please provide both a token and a secret key.' 
            });
            return;
        }
        
        try {
            const result = await verifySignature(encodedToken, secretKey, isBase64Encoded);
            
            if (result.error) {
                setSignatureVerification({ 
                    status: 'error', 
                    message: result.error
                });
                return;
            }
            
            if (result.isValid) {
                setSignatureVerification({ 
                    status: 'verified', 
                    message: `Signature verified successfully using ${result.algorithm}.` 
                });
            } else {
                setSignatureVerification({ 
                    status: 'invalid', 
                    message: `Invalid signature for ${result.algorithm}. Check your token and secret key.` 
                });
            }
        } catch (error) {
            console.error("Verification error:", error);
            setSignatureVerification({ 
                status: 'error', 
                message: 'Error during verification. Check your inputs and try again.' 
            });
        }
    };

    const handleTokenChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setEncodedToken(e.target.value);
    };

    const handleSecretChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSecretKey(e.target.value);
    };

    const handleTextareaFocus = () => {
        setIsTextareaFocused(true);
    };

    const handleTextareaBlur = () => {
        setIsTextareaFocused(false);
    };

    const handleBase64CheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        setIsBase64Encoded(e.target.checked);
    };

    const renderJson = (data: object | null | string) => {
        if (data === null) return <span className="jwt-null">null</span>;
        if (typeof data === 'string') return <pre className="whitespace-pre-wrap break-all">{data}</pre>;
        try {
            const jsonStr = JSON.stringify(data, null, 2);
            return (
                <pre className="whitespace-pre-wrap break-all">{
                    jsonStr.split('\n').map((line, index) => {
                        // Highlight keys in JSON objects
                        const keyMatch = line.match(/^(\s*)(".*?")(\s*:)(.*)$/);
                        if (keyMatch) {
                            return (
                                <div key={index}>
                                    {keyMatch[1]}
                                    <span className="jwt-json-key">{keyMatch[2]}</span>
                                    <span className="jwt-json-colon">{keyMatch[3]}</span>
                                    <span className="jwt-json-value">{keyMatch[4]}</span>
                                </div>
                            );
                        }
                        return <div key={index}>{line}</div>;
                    })
                }</pre>
            );
        } catch {
            return <span className="jwt-error">Error displaying data</span>;
        }
    };

    return (
        <div className="jwt-page">
            <header className="jwt-header">
                <div className="jwt-branding">
                    <h1 
                        className="jwt-brand-title" 
                        onClick={() => window.location.reload()}
                        style={{ cursor: 'pointer' }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        <FingerPrintIcon className="w-7 h-7 inline-block mr-2" />
                        Token Trace
                    </h1>
                    <p className="jwt-brand-description">Decode and Verify JWT with ease</p>
                </div>
                <button
                    onClick={toggleTheme}
                    className="theme-toggle"
                    aria-label="Toggle theme"
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                    <MoonIcon className={`w-5 h-5 theme-icon ${theme === 'light' ? 'visible' : 'hidden'}`} />
                    <SunIcon className={`w-5 h-5 theme-icon ${theme === 'dark' ? 'visible' : 'hidden'}`} />
                </button>
            </header>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="jwt-grid">
                {/* Encoded Section */}
                <div className="jwt-section">
                    <label htmlFor="encoded-token" className="jwt-input-label">
                        <CodeIcon className="w-4 h-4 inline-block mr-2" />
                        Encoded
                    </label>
                    <div className="jwt-small-text-container">
                        <div className="jwt-small-text">PASTE A TOKEN HERE</div>
                        <div className="flex gap-2">
                            <button 
                                onClick={clearToken}
                                className="jwt-sample-button"
                                aria-label="Clear token"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={insertSampleToken}
                                className="jwt-sample-button"
                                aria-label="Insert sample token"
                            >
                                Sample
                            </button>
                        </div>
                    </div>
                    <div className="jwt-textarea-container">
                        <textarea
                            id="encoded-token"
                            value={encodedToken}
                            onChange={handleTokenChange}
                            onFocus={handleTextareaFocus}
                            onBlur={handleTextareaBlur}
                            placeholder="Paste your JWT here..."
                            rows={8}
                            className="jwt-textarea"
                        />
                        <div className="jwt-textarea-preview">
                            {encodedToken ? (
                                <>
                                    {encodedToken.split('.').map((part, index) => {
                                        const colors = [
                                            "jwt-header-text", 
                                            "jwt-payload-text", 
                                            "jwt-signature-text"
                                        ];
                                        return (
                                            <span key={index}>
                                                <span className={colors[index % colors.length]}>{part}</span>
                                                {index < encodedToken.split('.').length - 1 && (
                                                    <span className="jwt-token-part-dot">.</span>
                                                )}
                                            </span>
                                        );
                                    })}
                                </>
                            ) : (
                                <span className={`jwt-placeholder ${isTextareaFocused ? 'hidden' : ''}`}>Paste your JWT here...</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Decoded Section */}
                <div className="jwt-section">
                    <div className="jwt-input-label">
                        <DocumentIcon className="w-4 h-4 inline-block mr-2" />
                        Decoded
                    </div>
                    <div className="jwt-small-text">EDIT THE PAYLOAD AND SECRET</div>
                    
                    {/* Header Section */}
                    <div className="jwt-card">
                        <div className="jwt-decoded-header">
                            <div className="jwt-decoded-header-label jwt-header-text">
                                <HeaderIcon className="w-3 h-3 inline-block mr-1" />
                                HEADER:
                            </div>
                            <div className="jwt-decoded-header-value">ALGORITHM & TOKEN TYPE</div>
                        </div>
                        <div className="jwt-card-content">
                            {renderJson(decodedHeader)}
                        </div>
                    </div>
                    
                    {/* Payload Section */}
                    <div className="jwt-card">
                        <div className="jwt-decoded-header">
                            <div className="jwt-decoded-header-label jwt-payload-text">
                                <PayloadIcon className="w-3 h-3 inline-block mr-1" />
                                PAYLOAD:
                            </div>
                            <div className="jwt-decoded-header-value">DATA</div>
                        </div>
                        <div className="jwt-card-content jwt-card-payload">
                            {renderJson(decodedPayload)}
                        </div>
                    </div>
                    
                    {/* Signature Section */}
                    <div className="jwt-card">
                        <div className="jwt-decoded-header">
                            <div className="jwt-decoded-header-label jwt-signature-text">
                                <SignatureIcon className="w-3 h-3 inline-block mr-1" />
                                VERIFY SIGNATURE
                            </div>
                            <div className="jwt-decoded-header-value">
                                {decodedHeader && typeof decodedHeader === 'object' && 
                                    (decodedHeader as any).alg ? 
                                    `ALGORITHM: ${(decodedHeader as any).alg}` : 
                                    'ALGORITHM: UNKNOWN'}
                            </div>
                        </div>
                        <div className="jwt-signature-verify">
                            <span className="jwt-signature-func">
                                {decodedHeader && typeof decodedHeader === 'object' && 
                                    (decodedHeader as any).alg ? 
                                    (decodedHeader as any).alg : 
                                    'HMACSHA256'}
                            </span>
                            <span className="jwt-signature-op">(</span>
                            <br />
                            <span className="jwt-signature-param">  base64UrlEncode(header)</span>
                            <span className="jwt-signature-op"> + </span>
                            <span className="jwt-signature-op">"."</span>
                            <span className="jwt-signature-op"> + </span>
                            <br />
                            <span className="jwt-signature-param">  base64UrlEncode(payload)</span>
                            <span className="jwt-signature-op">,</span>
                            <br />
                            <input 
                                type="text" 
                                placeholder={
                                    decodedHeader && typeof decodedHeader === 'object' && 
                                    (decodedHeader as any).alg?.startsWith('RS') ? 
                                    "your-public-key-or-certificate" : 
                                    "your-256-bit-secret"
                                }
                                className="jwt-signature-input"
                                value={secretKey}
                                onChange={handleSecretChange}
                            />
                            <br />
                            <span className="jwt-signature-op">)</span>
                        </div>
                        <div className="jwt-verify-checkbox">
                            <input 
                                type="checkbox" 
                                id="verify-signature"
                                checked={isBase64Encoded}
                                onChange={handleBase64CheckboxChange}
                            />
                            <label htmlFor="verify-signature">
                                {decodedHeader && typeof decodedHeader === 'object' && 
                                    (decodedHeader as any).alg?.startsWith('RS') ? 
                                    "public key is base64 encoded" : 
                                    "secret base64 encoded"}
                            </label>
                        </div>
                        <div className={`jwt-verification-status jwt-verification-${signatureVerification.status}`}>
                            {signatureVerification.status === 'verified' && (
                                <CheckBadgeIcon className="w-4 h-4 inline-block mr-1" />
                            )}
                            {signatureVerification.status === 'invalid' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline-block mr-1">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                </svg>
                            )}
                            {signatureVerification.status === 'error' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline-block mr-1">
                                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                            )}
                            {signatureVerification.message}
                        </div>
                    </div>
                </div>
            </div>

            {/* Explanation Section */}
            <JwtExplanation />
        </div>
    );
}