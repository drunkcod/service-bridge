import type { HttpResponse } from './../HttpResponse.js';

export const hello = (): HttpResponse => ({ status: 200, body: 'hello express bridge' });
