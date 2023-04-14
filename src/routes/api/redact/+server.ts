import { error, json, type RequestHandler } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generateCode from '@babel/generator';
import { generateMockData } from '../utils/mockData';

export const POST = (async ({ request }) => {
	try {
		console.log(`Received request to redact source code: ${request}`);
		const requestBody = request.body;
		const sourceCode = requestBody as unknown as string;

		if (sourceCode === undefined || sourceCode === null) {
			error(400, 'No source code provided');
		}

		// Parse the source code into an AST
		const ast = parse(sourceCode, { sourceType: 'module' });

		// Generate the mapping between original identifiers and mock data
		const identifierMap = new Map<string, string>();

		// Traverse the AST and replace the identifiers with mock data
		traverse(ast, {
			enter(path) {
				if (path.isIdentifier()) {
					const originalName = path.node.name;
					if (originalName === undefined) return;
					if (!identifierMap.has(originalName)) {
						identifierMap.set(originalName, generateMockData());
					}
					const nodeName = identifierMap.get(originalName);
					if (nodeName === undefined) return;
					path.node.name = nodeName;
				}
			}
		});

		// Generate the redacted source code from the modified AST
		const redactedCode = generateCode(ast);

		json({
			status: 200,
			body: {
				redactedCode,
				identifierMap: Object.fromEntries(identifierMap)
			}
		});
	} catch (err) {
		console.error(err);
		error(500, 'Failed to redact source code');
	}
}) satisfies RequestHandler;
