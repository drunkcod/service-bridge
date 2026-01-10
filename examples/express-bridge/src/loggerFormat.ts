import { format } from 'winston';
import { blue, gray, yellow, bold } from 'colorette';
import { threadId } from 'node:worker_threads';

const customFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
	// Format the thread ID: Main thread is 0
	const tId = threadId === 0 ? bold('main') : `worker:${threadId}`;

	// Colorize the timestamp
	const ts = gray(timestamp as string);

	// Colorize the thread ID for quick scanning
	const threadInfo = yellow(`[${tId}]`);

	// Handle metadata (if any)
	const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';

	return `${ts} ${threadInfo} ${level}: ${message}${metaString}`;
});

export const loggerFormat = format.combine(
	format.timestamp({ format: 'HH:mm:ss' }),
	format.colorize(), // Colorizes the "level" label
	customFormat
);
