import { z } from 'zod';

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  responseTime: z.number().optional(),
  isFlagged: z.boolean().optional(),
});

export const ChatSchema = z.object({
  id: z.string(),
  isAnswering: z.boolean(),
  title: z.string(),
  messages: z.array(MessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;
export type Chat = z.infer<typeof ChatSchema>;
