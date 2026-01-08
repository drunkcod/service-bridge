import { ServiceResponse } from '../ServiceResponse.js';

export const hello = (name?: string) => ServiceResponse.ok(`hello ${name ?? 'express bridge'}`);
