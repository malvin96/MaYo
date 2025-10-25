import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Category, Transaction } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

export const scanReceipt = async (
    base64Image: string, 
    mimeType: string,
    expenseCategories: Category[]
    ): Promise<{ amount?: number; category?: string; description?: string }> => {

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType,
        },
    };

    const validCategories = expenseCategories.map(c => c.name);

    const prompt = `
        Analyze the provided receipt image. Extract the following information and return it as a JSON object:
        1.  "amount": The total amount paid. This should be a number without any currency symbols or commas.
        2.  "category": The most relevant expense category from the following list: [${validCategories.join(', ')}]. If no category is a good match, return an empty string.
        3.  "description": A short, concise description of the purchase, often the name of the store or primary item.

        If any field cannot be determined, omit it from the JSON object. The JSON response must strictly follow the defined schema.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.NUMBER },
                        category: { type: Type.STRING },
                        description: { type: Type.STRING },
                    }
                }
            },
        });

        const text = response.text.trim();
        if (text.startsWith('{') && text.endsWith('}')) {
             const parsed = JSON.parse(text);
             if (parsed.category && !validCategories.includes(parsed.category)) {
                console.warn(`Gemini returned an invalid category: ${parsed.category}`);
                parsed.category = '';
             }
             return parsed;
        } else {
            console.error("Gemini response was not a valid JSON object:", text);
            throw new Error("Failed to parse receipt data from Gemini.");
        }
    } catch (error) {
        console.error("Error scanning receipt with Gemini:", error);
        throw new Error("Could not analyze receipt. Please try again or enter details manually.");
    }
};

export const suggestCategory = async (
    description: string,
    amount: number,
    expenseCategories: Category[]
): Promise<string> => {
    const validCategories = expenseCategories.map(c => c.name);

    const prompt = `
        Based on the transaction description "${description}" and amount ${amount}, suggest the most relevant expense category from this list: [${validCategories.join(', ')}].
        Return a JSON object with a single key "category". The value MUST be one of the categories from the list provided. If no category is a good match, return an empty string for the category value.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                    }
                }
            },
        });

        const text = response.text.trim();
        if (text.startsWith('{') && text.endsWith('}')) {
             const parsed = JSON.parse(text);
             // Validate if the returned category is in our list
             if (parsed.category && validCategories.includes(parsed.category)) {
                return parsed.category;
             }
             return ''; // Return empty if category is not valid or not found
        } else {
            console.error("Gemini category suggestion was not a valid JSON object:", text);
            return '';
        }
    } catch (error) {
        console.error("Error getting category suggestion from Gemini:", error);
        return ''; // Return empty on error
    }
};

const addTransactionDeclaration: FunctionDeclaration = {
    name: 'add_transaction',
    description: 'Adds a new income or expense transaction.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            amount: { type: Type.NUMBER, description: 'The transaction amount.' },
            description: { type: Type.STRING, description: 'A brief description of the transaction, e.g., "Coffee" or "Monthly Salary".' },
            category: { type: Type.STRING, description: 'The category of the transaction.' },
            type: { type: Type.STRING, description: 'The type of transaction, either "Income" or "Expense".' },
        },
        required: ['amount', 'description', 'category', 'type'],
    },
};

const updateTransactionDeclaration: FunctionDeclaration = {
    name: 'update_transaction',
    description: 'Updates an existing transaction based on user query.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            search_query: { type: Type.STRING, description: 'A query to find the transaction to update, e.g., "the coffee yesterday" or "my salary".' },
            updates: {
                type: Type.OBJECT,
                description: 'An object containing the fields to update.',
                properties: {
                    amount: { type: Type.NUMBER, description: 'The new transaction amount.' },
                    description: { type: Type.STRING, description: 'The new description.' },
                    category: { type: Type.STRING, description: 'The new category.' },
                }
            }
        },
        required: ['search_query', 'updates'],
    },
};

export const chatWithAI = async (
    prompt: string, 
    categories: Category[]
    ): Promise<{ text: string, functionCall?: any }> => {
    
    const validCategories = categories.map(c => c.name).join(', ');

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: `You are a financial assistant named MaYo Assist. Your goal is to help users manage their transactions.
                - When asked to add or record a transaction, use the 'add_transaction' function. Infer the category from this list: [${validCategories}].
                - When asked to change, modify, or update a transaction, use the 'update_transaction' function.
                - If the user's request is ambiguous or a general question, respond with a helpful text message.
                - Assume today is ${new Date().toDateString()}.
                - Do not ask for the account, it will be handled by the app.
                - Be friendly and concise.`,
                tools: [{ functionDeclarations: [addTransactionDeclaration, updateTransactionDeclaration] }],
            },
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            return { text: '', functionCall: response.functionCalls[0] };
        } else {
            return { text: response.text, functionCall: null };
        }

    } catch (error) {
        console.error("Error chatting with Gemini:", error);
        throw new Error("Failed to get a response from the AI assistant.");
    }
};


export const getFinancialHealthReport = async (
    financialData: object
): Promise<string> => {
    
    const prompt = `
        Analyze the following financial data and generate a report in Markdown format. The report MUST include the following sections, identified by these exact headings:

        ### Score
        - Start with a single line containing only a number from 1 to 100 representing the user's financial health score. A score of 100 is excellent. Base this score on savings rate, budget adherence, and overall financial stability reflected in the data.

        ### Summary
        - Provide a brief, one-paragraph overview of the user's financial situation.

        ### What You're Doing Well
        - List 2-3 positive aspects as a bulleted list. Use encouraging language.

        ### Areas for Improvement
        - List 2-3 areas where the user could improve, also as a bulleted list. Be constructive and avoid alarming language.

        ### Actionable Tips
        - Provide 2-3 concrete, actionable tips in a bulleted list. These should be practical steps the user can take to improve their financial health.

        User Data:
        ${JSON.stringify(financialData, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Using pro for better analysis
            contents: prompt,
            config: {
                systemInstruction: `You are "MaYo Advisor", an expert, friendly, and encouraging financial advisor. Your goal is to provide a clear, concise, and actionable financial health report based on the JSON data provided by the user. Keep the tone encouraging and helpful. The entire response must be in Markdown. Analyze the data in the context of Indonesian Rupiah (IDR).`,
            },
        });

        return response.text;

    } catch (error) {
        console.error("Error getting financial health report from Gemini:", error);
        throw new Error("Failed to get a response from the AI advisor.");
    }
};