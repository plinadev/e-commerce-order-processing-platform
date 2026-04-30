import { Router } from 'express';
import { validate } from './middleware/validate';
import {
  register, registerSchema,
  login, loginSchema,
  refresh, logout, me,
} from './controllers/auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', me);

export default router;
