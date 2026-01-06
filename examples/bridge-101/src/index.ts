import { startServices, stopServices } from './startServices.js';

console.log('hello from the main thread');

var services = await startServices();
const { add } = services;
console.log(await add(42, 42));

console.log(await services.add(20, 22));
await services.delay(1000);
try {
	await services.error();
} catch (err) {
	console.log(err);
}

stopServices(services);
