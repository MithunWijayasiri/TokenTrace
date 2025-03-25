import React from 'react';

const JwtExplanation = () => {
  return (
    <div className="jwt-explanation">
      <h2 className="jwt-explanation-title">About JSON Web Tokens (JWT)</h2>
      <div className="jwt-explanation-content">
        <section>
          <h3 className="jwt-section-title">Introduction</h3>
          <p>
            JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed. JWTs can be signed using a secret (with the HMAC algorithm) or a public/private key pair using RSA or ECDSA.
          </p>
        </section>
        
        <section>
          <h3 className="jwt-section-title">Structure of a JWT</h3>
          <p>
            A JWT consists of three parts separated by dots (.), which are:
          </p>
          
          {/* Visual representation of JWT structure */}
          <div className="jwt-flow-diagram">
            <div className="jwt-flow-dot jwt-flow-header-dot"></div>
            <div className="jwt-flow-line"></div>
            <div className="jwt-flow-dot jwt-flow-payload-dot"></div>
            <div className="jwt-flow-line"></div>
            <div className="jwt-flow-dot jwt-flow-signature-dot"></div>
          </div>
          
          <div className="jwt-structure-item jwt-header-item">
            <h4 className="jwt-structure-title jwt-header-text">Header</h4>
            <p className="jwt-structure-description">
              Typically consists of two parts: the type of the token, which is JWT, and the signing algorithm being used, such as HMAC SHA256 or RSA. This JSON is Base64Url encoded to form the first part of the JWT.
            </p>
            <pre className="jwt-pre">{`{
  "alg": "HS256",
  "typ": "JWT"
}`}</pre>
          </div>
          
          <div className="jwt-structure-item jwt-payload-item">
            <h4 className="jwt-structure-title jwt-payload-text">Payload</h4>
            <p className="jwt-structure-description">
              Contains the claims. Claims are statements about an entity (typically, the user) and additional data. There are three types of claims: registered, public, and private claims. Registered claims are a set of predefined claims which are not mandatory but recommended, such as <code className="jwt-code">iss</code>, <code className="jwt-code">exp</code>, <code className="jwt-code">sub</code>, <code className="jwt-code">aud</code>. The payload JSON is Base64Url encoded to form the second part.
            </p>
            <pre className="jwt-pre">{`{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}`}</pre>
          </div>
          
          <div className="jwt-structure-item jwt-signature-item">
            <h4 className="jwt-structure-title jwt-signature-text">Signature</h4>
            <p className="jwt-structure-description">
              To create the signature, you take the encoded header, the encoded payload, a secret, the algorithm specified, and sign it. E.g., <code className="jwt-code">HMACSHA256(encodedHeader + "." + encodedPayload, secret)</code>. It verifies the sender's identity and data integrity.
            </p>
          </div>
        </section>
        
        <section>
          <h3 className="jwt-section-title">Use Cases of JWT</h3>
          <div className="jwt-use-cases">
            <div className="jwt-use-case-item">
              <h4 className="jwt-use-case-title">Authorization</h4>
              <p>
                Once a user logs in, subsequent requests include the JWT, granting access to permitted resources. Widely used in Single Sign On (SSO).
              </p>
            </div>
            <div className="jwt-use-case-item">
              <h4 className="jwt-use-case-title">Information Exchange</h4>
              <p>
                Securely transmit information between parties. Signed JWTs ensure sender authenticity and data integrity.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default JwtExplanation; 