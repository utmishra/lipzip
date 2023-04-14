<script lang="ts">
	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { python } from '@codemirror/lang-python';
	import { java } from '@codemirror/lang-java';
	import { rust } from '@codemirror/lang-rust';
	import type { LanguageSupport } from '@codemirror/language';

	let code = "const API_KEY = 'abc'";
	$: redactedCode = '';
	$: error = '';
	let selectedLanguage = 'javascript';

	const languageModes: Record<string, () => LanguageSupport> = {
		javascript,
		python,
		java,
		rust
	};

	async function handleRedact() {
		const requestCode = {
			code: code
		} as unknown as string;
		console.log('Request code', requestCode);
		const response = await fetch('/api/redact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Language': selectedLanguage
			},
			body: JSON.stringify(requestCode)
		}).catch((requestError) => {
			error = requestError.message;
		});

		if (response.ok) {
			const { redactedCode: newRedactedCode } = await response.json();
			redactedCode = newRedactedCode;
		}
	}
</script>

<select bind:value={selectedLanguage}>
	<option value="javascript">JavaScript</option>
	<option value="python">Python</option>
	<option value="java">Java</option>
	<option value="go">Go</option>
	<option value="rust">Rust</option>
</select>

<CodeMirror bind:value={code} lang={languageModes[selectedLanguage]()} />

<button on:click={handleRedact}>Redact</button>

<pre>{redactedCode}</pre>
<div style="color: red;">{error}</div>
