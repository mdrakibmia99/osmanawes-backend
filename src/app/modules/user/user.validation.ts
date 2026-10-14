import { z } from 'zod';
import { USER_ROLE } from './user.constants';

const userValidationSchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long' }),
    email: z.string({ message: 'Invalid email address' }).email(),
    fullName: z.string({ message: 'Full name is required' }),
    role: z
      .enum([USER_ROLE.USER, USER_ROLE.BUSINESS], {
        message: 'Role must be user or business',
      })
      .optional(),
  }),
});

const userValidationForGoogleSchema = z.object({
  body: z.object({
    accessToken: z.string().nonempty({ message: 'Access Token is required!' }),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    about: z.string().optional(),
    phone: z
      .object({
        code: z.string().min(1, 'Phone code is required').optional(),
        number: z.string().min(6, 'Phone number is required').optional(),
      })
      .optional(),
    dob: z.string({ message: 'Date of birth is required' }).optional(),
    gender: z.enum(['male', 'female', 'other', 'N/A']).optional(),
  }),
});

const completeProfileSchema = z.object({
  body: z.object({
    about: z.string({ message: 'About is required' }),
  }),
});

const dayScheduleValidation = z.object({
  isOpen: z.boolean().default(false),
  startTime: z.string().default(''),
  endTime: z.string().default(''),
});

const completeBusinessProfileSchema = z.object({
  body: z.object({
    businessDetails: z.object({
      businessName: z.string({ message: 'Business name is required' }).min(1),
      businessNumber: z.string({ message: 'Business number is required' }).min(1),
      categoryId: z.string({ message: 'Category ID is required' }),
      shortBio: z.string().optional(),
      coverPhoto: z.string().optional(),
      businessAddress: z
        .object({
          coordinates: z.array(z.number()).length(2).optional(),
          address: z.string().optional(),
        })
        .optional(),
    }),
    openingHours: z
      .object({
        sat: dayScheduleValidation.optional(),
        sun: dayScheduleValidation.optional(),
        mon: dayScheduleValidation.optional(),
        tue: dayScheduleValidation.optional(),
        wed: dayScheduleValidation.optional(),
        thu: dayScheduleValidation.optional(),
        fri: dayScheduleValidation.optional(),
      })
      .optional(),
    queue: z
      .object({
        maxCapacity: z.number().min(0).optional(),
        waitTime: z.number().min(0).optional(),
        skipPassPrice: z.number().min(0).optional(),
      })
      .optional(),
    LegalCompliance: z.array(z.string()).optional(),
  }),
});

const updateBusinessProfileSchema = z.object({
  body: z.object({
    businessDetails: z
      .object({
        businessName: z.string().optional(),
        businessNumber: z.string().optional(),
        categoryId: z.string().optional(),
        shortBio: z.string().optional(),
        coverPhoto: z.string().optional(),
        BusinessAddress: z
          .object({
            coordinates: z.array(z.number()).length(2).optional(),
            address: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    openingHours: z
      .object({
        sat: dayScheduleValidation.optional(),
        sun: dayScheduleValidation.optional(),
        mon: dayScheduleValidation.optional(),
        tue: dayScheduleValidation.optional(),
        wed: dayScheduleValidation.optional(),
        thu: dayScheduleValidation.optional(),
        fri: dayScheduleValidation.optional(),
      })
      .optional(),
    queue: z
      .object({
        maxCapacity: z.number().min(0).optional(),
        waitTime: z.number().min(0).optional(),
        skipPassPrice: z.number().min(0).optional(),
      })
      .optional(),
    LegalCompliance: z.array(z.string()).optional(),
  }),
});

const fcmTokenValidationSchema = z.object({
  body: z.object({
    fcmToken: z.string().optional(),
  }),
});

export const userValidation = {
  userValidationSchema,
  completeProfileSchema,
  completeBusinessProfileSchema,
  updateBusinessProfileSchema,
  updateProfileSchema,
  userValidationForGoogleSchema,
  fcmTokenValidationSchema,
};
