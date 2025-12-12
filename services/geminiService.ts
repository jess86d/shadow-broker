import { GoogleGenAI, Type } from "@google/genai";
import { DynamicRules, OsintReport, TransactionAnalysis, CrawlResult, PaymentDetails, PaymentResult, StoredPaymentMethod, CodeFile } from "../types";
import { MOCK_PAYMENT_METHODS } from "../constants";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateText = async (prompt: string, format: 'plain' | 'markdown' = 'plain'): Promise<string> => {
  try {
    const formatInstruction = format === 'markdown' 
        ? "Format the response using Markdown syntax (headers, bold, lists, code blocks) where appropriate. Ensure it renders well in a terminal-style view." 
        : "STRICTLY return raw plain text only. Do NOT use any Markdown syntax. No headers (#), no bold (**), no italics (*), no list bullets (- or *), and no code fences (```). The output must be suitable for a raw system log or plain text editor. Use standard line breaks and indentation for structure if necessary, but keep it completely unadorned.";

    const systemInstruction = `You are Shadow Scribe, an advanced digital interface.
${formatInstruction}
You have access to Google Search. You MUST use it to retrieve accurate lyrics, real-time news, and factual data when requested. 
If the user asks for lyrics, search for them to ensure they are the correct, complete, and official lyrics.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      }
    });

    let text = response.text || "The void returned silence.";

    // Extract and append grounding sources (URLs) if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const urls = new Set<string>();
        chunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
                urls.add(chunk.web.uri);
            }
        });

        if (urls.size > 0) {
            const sourceList = Array.from(urls);
            if (format === 'markdown') {
                text += "\n\n---\n**Neural Link Sources:**\n" + sourceList.map(url => `- [${url}](${url})`).join('\n');
            } else {
                text += "\n\nNEURAL LINK SOURCES:\n" + sourceList.map(url => `- ${url}`).join('\n');
            }
        }
    }

    return text;
  } catch (error) {
    console.error("Error generating text:", error);
    return "Error: Unable to connect to the Abyssal Plane. The connection was severed.";
  }
};

export const generateCode = async (prompt: string, style: 'standard' | 'minified' = 'standard'): Promise<CodeFile[]> => {
    try {
        const styleInstruction = style === 'minified'
            ? "Code must be minified where possible (remove whitespace/comments). Optimize for size."
            : "Code must be well-formatted, indented, and documented with comments explaining complex logic.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Code Generation Request: ${prompt}.
                       Directive: Generate the necessary file(s) to completely fulfill this request. If it's a full app, generate multiple files (html, css, js, etc.). 
                       IMPORTANT: If the request implies a runnable web application, YOU MUST GENERATE an 'index.html' file that links the other files (css/js) so it can be previewed.
                       Style: ${styleInstruction}.
                       Return a JSON object containing a 'files' array.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        files: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "File name with extension (e.g., 'app.ts', 'styles.css')" },
                                    content: { type: Type.STRING, description: "The full content of the file" },
                                    language: { type: Type.STRING, description: "Programming language identifier (e.g. typescript, python, css)" },
                                },
                                required: ["name", "content", "language"]
                            }
                        }
                    }
                }
            }
        });
        
        const json = JSON.parse(response.text || '{ "files": [] }');
        return json.files || [];
    } catch (error) {
        console.error("Error generating code:", error);
        return [{ name: "error.log", content: `// Error: Construct assembly failed.\n// ${error}`, language: "text" }];
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    // Use gemini-2.5-flash-image for general image generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
          // Defaults are usually sufficient, explicit aspect ratio can be added if needed
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    let textOutput = '';
    
    if (parts) {
      for (const part of parts) {
        // Check for inline image data
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
        // Collect text in case of refusal/error
        if (part.text) {
            textOutput += part.text;
        }
      }
    }
    
    if (textOutput) {
        return `Error: The model returned a text response instead of an image (likely safety refusal): ${textOutput}`;
    }

    return "Error: The Abyss forged an empty vision. No image data received.";
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "Error: The Abyss forged a corrupted vision.";
  }
};

export const analyzeTransaction = async (data: any, rules: DynamicRules): Promise<TransactionAnalysis | string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this transaction for fraud: ${JSON.stringify(data)}. 
                       Consider these threat rules: ${JSON.stringify(rules)}.
                       Return JSON matching the schema.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ml_fraud_proba: { type: Type.NUMBER },
                        is_anomaly: { type: Type.BOOLEAN },
                        rule_based_fraud: { type: Type.BOOLEAN },
                        triggered_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
                        final_decision: { type: Type.BOOLEAN },
                        summary: { type: Type.STRING }
                    }
                }
            }
        });
        const text = response.text;
        if (!text) return "Analysis produced no data.";
        return JSON.parse(text) as TransactionAnalysis;
    } catch (error) {
        console.error("Analysis error:", error);
        return "Analysis failed due to network entropy.";
    }
};

export const crawlUrl = async (url: string, country: string, city: string): Promise<CrawlResult> => {
    // 1. Attempt Direct Connection (Real HTTP Request)
    try {
        // We use a short timeout to fail fast if network/CORS hangs
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(url, { 
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'text/html,application/json,text/plain'
            }
        });
        clearTimeout(id);

        const text = await response.text();
        return {
            original_url: url,
            final_url: response.url,
            status_code: response.status,
            content_length: text.length,
            content_preview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
            error_message: null,
            proxy_location: 'Direct Uplink (Client-Side)'
        };
    } catch (directError) {
        // 2. Fallback: Neural Search Grounding (Real Data via Gemini Search Tool)
        // If direct fetch fails (CORS, blocking, etc.), we ask Gemini to retrieve the actual page content info via Google Search.
        try {
            const locationContext = (country || city) ? `Context: The user is interested in this target relevant to ${city}, ${country}.` : "";
            
            const prompt = `TARGET_URL: ${url}
                            ${locationContext}
                            TASK: Perform a real-time reconnaissance of this URL using Google Search.
                            REQUIREMENTS:
                            1. Retrieve the ACTUAL content summary, latest news, or main page text of the target URL.
                            2. Do NOT simulate or hallucinate data. Use only real information found via the search tool.
                            3. If the site is down or not found, report status_code 404.
                            4. If found, report status_code 200.
                            5. In 'content_preview', provide a detailed summary of what is currently on the site.
                            
                            Return JSON.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            original_url: { type: Type.STRING },
                            final_url: { type: Type.STRING },
                            status_code: { type: Type.INTEGER },
                            content_length: { type: Type.INTEGER },
                            content_preview: { type: Type.STRING },
                            error_message: { type: Type.STRING, nullable: true },
                            proxy_location: { type: Type.STRING, nullable: true }
                        }
                    }
                }
            });

            const text = response.text;
            if (!text) throw new Error("Neural link returned void.");

            const result = JSON.parse(text) as CrawlResult;
            return {
                ...result,
                original_url: url, // Ensure input url is kept
                proxy_location: 'Neural Search Link (Grounding)',
                error_message: null
            };

        } catch (aiError) {
             return {
                original_url: url,
                final_url: url,
                status_code: 0,
                content_length: 0,
                content_preview: "",
                error_message: `Target unreachable. Direct Uplink failed (CORS/Network). Neural Link failed: ${aiError instanceof Error ? aiError.message : 'Unknown'}`,
                proxy_location: 'N/A'
            };
        }
    }
};

export const runOsintScan = async (target: string): Promise<OsintReport | string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `TARGET: "${target}"
            
            MISSION: Perform a real-time open-source intelligence (OSINT) investigation using Google Search.
            
            DIRECTIVES:
            1.  **Identity Verification**: Determine if the target is a person, organization, or domain.
            2.  **Web Presence**: Find the primary website and provide a detailed summary of the entity.
            3.  **Domain Reconnaissance**: If the target is a domain (e.g., 'example.com'), use search results to find public registration details (Organization, Creation Date, etc.). If it's a person, 'whois_data' can be null.
            4.  **Social footprint**: Locate official profiles on Twitter (X), LinkedIn, and GitHub.
            
            OUTPUT REQUIREMENT:
            Return ONLY a raw JSON object. Do not include Markdown formatting (no \`\`\`json fences).
            The JSON must strictly match this schema:
            {
                "target": "${target}",
                "google_search": {
                    "search_url": "Primary URL found (e.g. official site)",
                    "summary": "Comprehensive summary of findings...",
                    "error": null
                },
                "domain_info": {
                    "status": "Active, Inactive, or Unknown",
                    "whois_data": {
                        "organization": "string or null",
                        "creation_date": "string or null",
                        "expiration_date": "string or null",
                        "name_servers": ["ns1", "ns2"] or null
                    },
                    "error": null
                },
                "social_media_presence": {
                    "profiles": {
                        "twitter": { "url": "string", "found": boolean },
                        "linkedin": { "url": "string", "found": boolean },
                        "github": { "url": "string", "found": boolean }
                    }
                }
            }`,
            config: {
                tools: [{ googleSearch: {} }],
                // Note: responseSchema/responseMimeType are disabled to allow Search Tool usage
            }
        });

        const text = response.text;
        if (!text) return "Scan failed: No intelligence retrieved.";

        // Sanitize: Remove markdown fences if the model ignores the instruction
        const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();

        try {
            return JSON.parse(jsonStr) as OsintReport;
        } catch (parseError) {
            console.error("OSINT JSON Parse Error:", parseError);
            // Attempt to extract JSON if mixed with text
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]) as OsintReport;
                } catch (e) {
                     return "Scan failed: Intelligence data stream corrupted.";
                }
            }
            return "Scan failed: Intelligence data stream corrupted.";
        }
    } catch (error) {
        console.error("OSINT Scan Error:", error);
        return "OSINT scan failed: Network uplink severed.";
    }
};

export const fetchPaymentMethods = async (customerId: string): Promise<StoredPaymentMethod[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 3 realistic stored payment methods for customer ID: "${customerId}".
                       Vary the types (Credit Card, Personal Checking, Savings, Crypto Wallet).
                       Generate realistic random numbers for account/routing (masked).
                       
                       Return a JSON Array matching this schema exactly:
                       [{
                         "id": "string",
                         "name": "string (e.g. Chase Sapphire, Wells Fargo Checking)",
                         "accountNumber": "string (last 4 masked e.g. ****1234)",
                         "accountType": "string (CREDIT_CARD, PERSONAL_CHECKING, SAVINGS, CRYPTO_WALLET)",
                         "routingNumber": "string (masked or N/A)",
                         "default": boolean,
                         "created": "ISO date string",
                         "updated": "ISO date string",
                         "inputType": "string (KEYED, SWIPED, NETWORK)",
                         "phone": "string"
                       }]
                       Ensure valid JSON.`,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const text = response.text || "[]";
        return JSON.parse(text) as StoredPaymentMethod[];
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return [];
    }
};

export const recordPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
     try {
         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `Process this financial transaction request acting as a strict, high-security financial ledger API.
                        Transaction Details: ${JSON.stringify(details)}.
                        
                        Rules for Approval:
                        1. Decline if amount > 50000 with message "Transaction limit exceeded for this tier".
                        2. Decline if privateNote contains keywords "hack", "exploit", "stealth", "bypass" with message "Security policy violation detected".
                        3. Otherwise, AUTHORIZE the transaction.

                        Return a JSON object matching this schema:
                        {
                          "status": "success" | "error",
                          "message": "string (Short status message)",
                          "details": "string (Detailed reason or confirmation code)",
                          "payment": {
                             "id": "string (Generate a unique, complex transaction hash)",
                             "amount": number,
                             "customerId": "string",
                             "created_at": "ISO date string (now)"
                          } (Include this object ONLY if status is success)
                        }`,
             config: {
                 responseMimeType: 'application/json',
             }
         });

         const text = response.text;
         if (!text) throw new Error("Ledger failed to write.");
         
         return JSON.parse(text) as PaymentResult;
     } catch (error) {
         console.error("Payment Record Error:", error);
         return {
             status: 'error',
             message: 'Network Failure',
             details: 'The connection to the decentralized ledger was severed during transmission.'
         };
     }
};