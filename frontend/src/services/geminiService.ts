import axios from 'axios';

interface GeminiResponse {
  answer: string;
  cached?: boolean;
}

/**
 * Service to interact with Gemini API
 * Note: In production, this should be called through backend to protect API keys
 */
export const geminiService = {
  /**
   * Ask Gemini a question about a product
   * @param question - The question to ask Gemini
   * @param productId - The product ID to cache the answer
   * @returns Promise with Gemini's response
   */
  askQuestion: async (question: string, productId: string): Promise<string> => {
    try {
      // Call backend endpoint to handle Gemini API
      // This protects the API key and allows for better error handling
      const response = await axios.post<GeminiResponse>('/api/products/gemini/ask/', {
        question,
        product_id: productId,
      });
      return response.data.answer;
    } catch (error: unknown) {
      console.error('Failed to get Gemini response:', error);
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.detail || 'Gemini APIへの接続に失敗しました'
        : 'Gemini APIへの接続に失敗しました';
      throw new Error(errorMessage);
    }
  },
};

