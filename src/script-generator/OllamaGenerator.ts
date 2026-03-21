import axios from 'axios';
import { SceneInput } from '../types/shorts';

export class OllamaGenerator {
  private ollamaUrl: string;
  private model: string;

  constructor(ollamaUrl: string = 'http://localhost:11434', model: string = 'llama3') {
    this.ollamaUrl = ollamaUrl;
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
   - "searchTerms": An array of 3-5 keywords for finding background visuals.
   - "headline": A short, high-impact headline for the top banner.

JSON Format Example:
[
  {
    "text": "World leaders meet in Geneva to discuss the latest climate accords...",
    "searchTerms": ["climate summit", "geneva", "world leaders"],
    "headline": "CLIMATE CRISIS TALKS"
  }
]
`;

    console.log(`Sending prompt to Ollama at ${this.ollamaUrl}/api/generate using model ${this.model}`);
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        format: 'json'
      });

      console.log(`Ollama response status: ${response.status}`);
      const result = response.data;
      const jsonStr = result.response;
      console.log(`Ollama generated response: ${jsonStr}`);
      
      let scenes: any;
      try {
        scenes = JSON.parse(jsonStr);
      } catch (e) {
        // Fallback: Try to find JSON array using regex
        const match = jsonStr.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            scenes = JSON.parse(match[0]);
          } catch (e2) {
            throw new Error('Could not parse JSON array from Ollama response');
          }
        } else {
          const error: any = new Error('No JSON array found in Ollama response');
          error.rawResponse = jsonStr;
          throw error;
        }
      }
      
      // If the model wrapped it in an object like { "scenes": [...] }
      if (!Array.isArray(scenes) && typeof scenes === 'object' && scenes !== null) {
        const possibleArray = scenes.scenes || scenes.script || Object.values(scenes).find(Array.isArray);
        if (possibleArray) {
          scenes = possibleArray;
        }
      }

      if (!Array.isArray(scenes)) {
        const error: any = new Error('Ollama output is not an array');
        error.rawResponse = jsonStr;
        throw error;
      }

      return scenes.slice(0, 7); // Limit to 7 scenes max
    } catch (error: any) {
      console.error('Ollama generation failed:', error);
      const enhancedError: any = new Error(error.message);
      enhancedError.rawResponse = error.rawResponse || 'No raw response';
      throw enhancedError;
    }
  }
}
