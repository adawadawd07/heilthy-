import { FoodAnalysisResult } from '@/types';

export interface VisionProvider {
  analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult>;
}

class MockVisionProvider implements VisionProvider {
  async analyzeFoodImage(_imageBase64: string): Promise<FoodAnalysisResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          items: [
            {
              name: 'boiled egg',
              name_ar: 'بيض مسلوق',
              name_en: 'Boiled egg',
              estimated_count: 3,
              unit: 'piece',
              estimated_weight_g: 150,
              confidence: 'high',
            },
          ],
          notes: [
            'Exact portion size cannot be determined from the image.',
            'Values are estimates and may vary.',
          ],
        });
      }, 1500);
    });
  }
}

class OpenAIVisionProvider implements VisionProvider {
  constructor(private apiKey: string) {}
  async analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: [
              'You are a nutrition vision assistant. Identify every visible food, estimate its cooked weight in grams,',
              'and provide reference nutrition values per 100 grams for that specific food.',
              'Return strict JSON only (no markdown) shaped as:',
              '{"items":[{"name":string,"name_ar":string,"name_en":string,"estimated_count":number,"unit":string,',
              '"estimated_weight_g":number,"confidence":"high"|"medium"|"low",',
              '"calories_per_100g":number,"protein_g_per_100g":number,"carbs_g_per_100g":number,"fat_g_per_100g":number}],',
              '"notes":string[]}',
              'name_ar must be Arabic. Never return 0 for calories_per_100g unless the item is water.',
              'Macros must be physically consistent: protein*4 + carbs*4 + fat*9 should be within 10% of calories_per_100g.',
            ].join(' '),
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this food image and return JSON.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 900,
      }),
    });
    if (!response.ok) throw new Error('AI provider error');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider returned an empty response');
    return JSON.parse(content) as FoodAnalysisResult;
  }
}

/**
 * True only when a real provider is wired up. Without it the app falls back to
 * MockVisionProvider, which always returns the same sample result.
 */
export function isVisionConfigured(): boolean {
  return process.env.AI_PROVIDER === 'openai' && Boolean(process.env.AI_API_KEY);
}

export function getVisionProvider(): VisionProvider {
  if (isVisionConfigured()) {
    return new OpenAIVisionProvider(process.env.AI_API_KEY as string);
  }
  return new MockVisionProvider();
}
