import { z } from 'zod';

export const ChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['system', 'user', 'assistant'], {
    errorMap: () => ({ message: 'Role must be system, user, or assistant' }),
  }),
  content: z.string().max(100000, 'Message content exceeds maximum character limit of 100,000'),
  images: z.array(z.string().max(10_000_000, 'Image data exceeds 10MB limit')).max(5, 'Maximum 5 images allowed per message').optional(),
});

export const GenerationSettingsSchema = z.object({
  temperature: z.number().min(0, 'Temperature must be >= 0').max(2, 'Temperature must be <= 2').default(0.7),
  maxTokens: z.number().int().min(1, 'Max tokens must be >= 1').max(32768, 'Max tokens must be <= 32768').default(2048),
  topP: z.number().min(0, 'Top-p must be >= 0').max(1, 'Top-p must be <= 1').default(1.0),
  stream: z.boolean().default(true),
});

export const ChatRequestSchema = z.object({
  modelId: z.string().min(1, 'Model ID is required'),
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required').max(50, 'Max 50 messages allowed'),
  settings: GenerationSettingsSchema,
});

export type ValidatedChatRequest = z.infer<typeof ChatRequestSchema>;
