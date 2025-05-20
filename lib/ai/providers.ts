import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  createLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

const deepSeekWrapper = (model: string) =>
  wrapLanguageModel({
    model: createLanguageModel({
      id: `deepseek-${model}`,
      name: `DeepSeek ${model}`,
      async callChat({ messages, stream }) {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            stream,
          }),
        });

        if (!res.body) throw new Error('No response body from DeepSeek API');

        return stream
          ? res.body // untuk streaming
          : {
              text: (await res.json()).choices?.[0]?.message?.content ?? '',
            };
      },
    }),
    middleware: [],
    providerId: 'deepseek',
    modelId: model,
  });

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': xai('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),

        // ✅ DeepSeek model
        'deepseek-chat': deepSeekWrapper('deepseek-chat'),
        'deepseek-coder': deepSeekWrapper('deepseek-coder'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
