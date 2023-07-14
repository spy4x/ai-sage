import type { Message } from '../../src/lib/shared/types';
import { createChatCompletion, openai } from './openai';
import { marked } from 'marked';
import hljs from 'highlight.js';

// code highlighting
marked.setOptions({
  highlight: function (code, language) {
    if (!language) {
      return hljs.highlightAuto(code).value;
    }
    return hljs.highlight(code, { language }).value;
  },
});
// #endregion

export async function chatgpt(
  messages: Message[],
  userId: string,
): Promise<{
  content: string;
  title: string;
  responseTime: number;
  isFlagged: boolean;
}> {
  const startTime = Date.now();
  const validationResponse = await openai.createModeration({
    input: messages[messages.length - 1].content,
  });
  const validation = validationResponse.data.results[0];
  if (validation.flagged) {
    return {
      content: `⚠️ Your message was flagged as inappropriate. Please try to rephrase it.`,
      title: '',
      responseTime: Date.now() - startTime,
      isFlagged: true,
    };
  }
  const [content, title] = await Promise.all([
    generateAnswer(messages, userId),
    generateTitle(messages, userId),
  ]);
  const responseTime = Date.now() - startTime;
  return { content, title, responseTime, isFlagged: false };
}

async function generateAnswer(messages: Message[], userId: string): Promise<string> {
  // TODO: calculate tokens and cut off older messages
  const answer = await createChatCompletion(
    [
      {
        role: 'system',
        content:
          'You are ChatGPT, a useful assistant. You answer using Markdown code. If you need to write programming code snippets - use correct Markdown format, like ```javascript alert("Hello World!") ```. That will make UI to render your answer nicely.',
      },
      ...messages.map(message => ({ role: message.role, content: message.content })),
    ],
    userId,
  );
  console.log('answer before markdown', answer);
  return marked(answer);
}

async function generateTitle(messages: Message[], userId: string): Promise<string> {
  const isFirstMessage = messages.length === 1;
  if (!isFirstMessage) {
    return '';
  }
  return createChatCompletion(
    [
      {
        role: 'user',
        content: `Summarize text into max 5 words. No quotes or special characters. Text:"""
${messages[0].content}
"""`,
      },
    ],
    userId,
  );
}
