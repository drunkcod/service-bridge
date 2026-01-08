import { startServices } from './startServices.js';
import { transfer } from '@drunkcod/service-bridge';

(async function main() {
	var proxy = await startServices();
	const services = proxy.services;

	console.log('🤘🏻 hello service-bridge 101 world. Ctrl+C to quit.');

	process.once('SIGINT', async () => {
		console.log('bye...');
		proxy.close();
		await new Promise((resolve) => process.stdout.write('', resolve));
	});

	//sync target becomes async
	console.log(await services.add(20, 22));

	//async target, stays async :)
	await services.delay(1000);

	//errors are trnsported, but become ServiceBridgeCallErrors.
	try {
		await services.error();
	} catch (err) {
		console.log(err);
	}

	// cloning errors during call.
	try {
		await services.echo({ notClonable: Symbol('will-fail') });
	} catch (err) {
		console.log(err);
	}
	// cloning errors during reply.
	try {
		await services.badReply();
	} catch (err) {
		console.log(err);
	}

	//transferrable
	const m = new MessageChannel();
	m.port1.on('message', (message) => console.log(message));
	await services.transfer(transfer(m.port2));
})();
