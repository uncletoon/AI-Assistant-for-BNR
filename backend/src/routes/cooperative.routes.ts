import { Router } from 'express';
import {
  listCooperatives,
  searchCooperatives,
  getCooperative,
  getCooperativeInstitutionalProfile,
} from '../controllers/cooperative.controller.js';

export const cooperativeRouter = Router();

cooperativeRouter.get('/cooperatives', listCooperatives);
cooperativeRouter.get('/cooperatives/search', searchCooperatives);
cooperativeRouter.get('/cooperatives/:id', getCooperative);
cooperativeRouter.get('/cooperatives/:id/institutional-profile', getCooperativeInstitutionalProfile);
