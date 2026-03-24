import axios from 'axios';
import { SceneInput } from '../types/shorts';

export class AiLlmGenerator {
  private apiUrl: string;
  private model: string;

  constructor(apiUrl: string = 'http://localhost:12434', model: string = 'docker.io/ai/llama3.2:latest') {
    this.apiUrl = apiUrl;
    this.model = model;
  }

  async generateScript(newsStories: any[]): Promise<SceneInput[]> {
    const newsContent = newsStories
      .map((s, i) => `${i + 1}. TITLE: ${s.title}\nCONTENT: ${s.content}`)
      .join('\n\n');

    const prompt = `
You are a professional world news script writer.
Given the following news stories, create a 5-scene video script for a short video (TikTok/Shorts style).
Each scene must relate to these stories and be engaging.

Stories:
${newsContent}

STRICT INSTRUCTIONS:
1. Output ONLY a valid JSON array. 
2. NO text before or after the JSON.
3. Start the output with "[" and end it with "]".
4. Each object must have these EXACT fields:
   - "text": Punchy narration for the scene (around 20-30 words).
   - "searchTerms": An array of 3-5 HIGHLY SPECIFIC keywords for stock video search (e.g., "busy stock trading floor" instead of "money").
   - "headline": A short, high-impact headline for the top banner.
   - "visualPrompt": A detailed, descriptive visual prompt for AI image generation (e.g., "Close-up of a high-tech stock market display with green glowing numbers in a dark futuristic office").

JSON Format Example:
[
  {
    "text": "World leaders meet in Geneva to discuss the latest climate accords...",
    "searchTerms": ["climate summit", "geneva", "world leaders meeting"],
    "headline": "CLIMATE CRISIS TALKS",
    "visualPrompt": "A large conference hall in Geneva with world flags and leaders sitting at a round table, cinematic lighting, professional atmosphere."
  }
]
`;

    console.log(`Sending prompt to AI LLM at ${this.apiUrl}/api/generate using model ${this.model}`);
    try {
      const response = await axios.post(`${this.apiUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        format: 'json'
      });

      console.log(`AI LLM response status: ${response.status}`);
      const result = response.data;
      if (!result || typeof result !== 'object') {
        const error: any = new Error('Invalid response from AI LLM (no data)');
        error.rawResponse = JSON.stringify(result);
        throw error;
      }

      const jsonStr = result.response;
      if (!jsonStr) {
        const error: any = new Error('AI LLM returned empty response field');
        error.rawResponse = JSON.stringify(result);
        throw error;
      }

      console.log(`AI LLM generated response length: ${jsonStr.length} chars`);
      
      let scenes: any;
      try {
        // Try direct parse first
        scenes = JSON.parse(jsonStr);
      } catch (e) {
        console.log('[AiLlmGenerator] Initial JSON parse failed, trying regex extraction...');
        // Fallback: Try to find JSON array or object using regex
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
        const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
        
        if (arrayMatch) {
          try {
            scenes = JSON.parse(arrayMatch[0]);
          } catch (e2) {
            console.error('[AiLlmGenerator] Regex array parse failed');
          }
        }
        
        if (!scenes && objectMatch) {
          try {
            scenes = JSON.parse(objectMatch[0]);
          } catch (e2) {
            console.error('[AiLlmGenerator] Regex object parse failed');
          }
        }

        if (!scenes) {
          const error: any = new Error('Could not parse JSON from AI LLM response');
          error.rawResponse = jsonStr;
          throw error;
        }
      }
      
      // If the model wrapped it in an object like { "scenes": [...] }
      if (!Array.isArray(scenes) && typeof scenes === 'object' && scenes !== null) {
        // Case 1: Wrapped in a known property
        const possibleArray = scenes.scenes || scenes.script || Object.values(scenes).find(Array.isArray);
        if (possibleArray) {
          scenes = possibleArray;
        } 
        // Case 2: Indexed object like {"0": {...}, "1": {...}}
        else if (Object.keys(scenes).every(key => !isNaN(Number(key)))) {
          console.log('[AiLlmGenerator] Detected indexed object, converting to array');
          scenes = Object.keys(scenes)
            .sort((a, b) => Number(a) - Number(b))
            .map(key => (scenes as any)[key]);
        }
      }

      if (!Array.isArray(scenes)) {
        const error: any = new Error('AI LLM output is not an array');
        error.rawResponse = jsonStr;
        throw error;
      }

      // Normalize fields to ensure they match what the UI expects
      const normalizedScenes = scenes.map(scene => {
        if (typeof scene !== 'object' || scene === null) return scene;
        
        return {
          text: scene.text || scene.narration || scene.content || scene.speech || scene.description || '',
          headline: scene.headline || scene.title || scene.header || scene.banner || '',
          visualPrompt: scene.visualPrompt || scene.imagePrompt || scene.prompt || scene.visual || scene.image_prompt || '',
          searchTerms: Array.isArray(scene.searchTerms) 
            ? scene.searchTerms 
            : (scene.keywords || scene.tags || scene.search_terms || [])
        };
      });

      return normalizedScenes.slice(0, 7); // Limit to 7 scenes max
    } catch (error: any) {
      console.error('AI LLM generation failed:', error);
      let errorMsg = error.message;
      let rawResponse = error.rawResponse || 'No raw response';

      if (error.response?.data) {
        const aiLlmError = error.response.data.error || JSON.stringify(error.response.data);
        errorMsg = `AI LLM Error: ${aiLlmError}`;
        rawResponse = JSON.stringify(error.response.data);
        
        if (aiLlmError.includes('terminated') || aiLlmError.includes('exit status 2')) {
          errorMsg = 'AI LLM model crashed (likely Out of Memory). Please use a smaller model like llama3.2:1b or increase your system RAM.';
        }
      }

      const enhancedError: any = new Error(errorMsg);
      enhancedError.rawResponse = rawResponse;
      throw enhancedError;
    }
  }
}
