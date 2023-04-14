import { error, json } from '@sveltejs/kit';
import { parse } from '@babel/parser';
import type { ParserOptions } from '@babel/parser';
import traverse from '@babel/traverse';
import generateCode from '@babel/generator';
import { generateMockData } from '../utils/mockData';

function getParserOptions(language: string | null): ParserOptions | undefined {
	if (!language) return;

	const defaultOptions: ParserOptions = {
		sourceType: 'module'
	};

	switch (language) {
		case 'javascript': {
			const plugins: any = [
				['typescript', {}],
				['jsx', {}]
			];
			return {
				...defaultOptions,
				plugins
			};
		}
		// Add cases for other languages as needed
		default:
			return defaultOptions;
	}
}

export async function POST({ request }) {
	try {
		console.log(`Received request to redact source code: ${request}`);
		const requestBody = await request.json();
		const language = request.headers.get('X-Language');
		const sourceCode = requestBody.code;

		if (!sourceCode) {
			error(400, 'No source code provided');
		}

		const parserOptions = getParserOptions(language);

		if (!parserOptions) {
			error(400, 'Invalid language specified');
		} else {
			const ast = parse(sourceCode, parserOptions);

			const identifierMap = new Map<string, string>();

			traverse(ast, {
				enter(path) {
					if (path.isIdentifier()) {
						const originalName = path.node.name;
						if (!originalName) return;
						if (!identifierMap.has(originalName)) {
							identifierMap.set(originalName, generateMockData());
						}
						const nodeName = identifierMap.get(originalName);
						if (!nodeName) return;
						path.node.name = nodeName;
					}
				}
			});

			const { code: redactedCode } = generateCode(ast);

			return json({
				status: 200,
				redactedCode
			});
		}
	} catch (err) {
		console.error('Error while parsing code', err);
		error(500, 'Failed to redact source code');
	}
}
