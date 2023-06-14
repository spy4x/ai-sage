import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateImageRequestSizeEnum,
  OpenAIApi,
} from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey });
export const openai = new OpenAIApi(configuration);

export async function createChatCompletion(
  messages: ChatCompletionRequestMessage[],
  userId: string,
): Promise<string> {
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    user: userId,
  });
  const message = response.data.choices[0].message;
  if (!message) {
    throw new Error('No answer from OpenAI:' + JSON.stringify(response.data, null, 4));
  }
  return message.content;
}

export async function createImage(
  prompt: string,
  userId: string,
  amount = 10,
  size: CreateImageRequestSizeEnum = '1024x1024',
): Promise<string[]> {
  const response = await openai.createImage({
    prompt,
    n: amount,
    size,
    user: userId,
  });
  return response.data.data.map(image => image.url!);
}
