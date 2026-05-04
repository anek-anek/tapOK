import { z } from 'zod';

export const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms & Conditions and Privacy Policy',
  }),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ['confirmNewPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
