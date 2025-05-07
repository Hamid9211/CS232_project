// app/doctor-login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';

interface Doctor {
  id: string;
  name: string;
  email: string;
  password: string;
  specialty: string;
  experience: string;
  avatar: string;
  bio: string;
  availability: string;
  ratings: number;
}
