import { z } from 'zod';

export const itemSchema = z.object({
  name: z.string()
    .min(1, 'O nome do item é obrigatório')
    .max(100, 'O nome do item não pode ter mais de 100 caracteres'),
  quantity: z.number()
    .min(0.01, 'A quantidade deve ser maior que zero')
    .max(9999, 'A quantidade não pode ser maior que 9999'),
  price: z.number()
    .min(0, 'O preço não pode ser negativo')
    .max(999999.99, 'O preço não pode ser maior que 999999.99'),
  completed: z.boolean().optional(),
});

export const listSchema = z.object({
  name: z.string()
    .min(1, 'O nome da lista é obrigatório')
    .max(100, 'O nome da lista não pode ter mais de 100 caracteres'),
  budget: z.number()
    .min(0, 'O orçamento não pode ser negativo')
    .max(999999.99, 'O orçamento não pode ser maior que 999999.99'),
});

export const userSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'O email é obrigatório'),
  password: z.string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .max(100, 'A senha não pode ter mais de 100 caracteres'),
});

export type ItemFormData = z.infer<typeof itemSchema>;
export type ListFormData = z.infer<typeof listSchema>;
export type UserFormData = z.infer<typeof userSchema>; 