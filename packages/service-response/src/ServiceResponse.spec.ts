import { ServiceResponse, getResponseMessage } from './ServiceResponse.js';

describe('ServiceResponse', () => {
  it('should create a response with status and body', () => {
    const response = ServiceResponse(200, { message: 'Success' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
    expect(response.message).toBe('Ok');
  });

  it('should get correct response message', () => {
    expect(getResponseMessage(404)).toBe('Not Found');
    expect(getResponseMessage(500)).toBe('Internal Server Error');
  });

  it('should support factory methods', () => {
    const response = ServiceResponse.ok({ data: 'test' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: 'test' });
  });
});
