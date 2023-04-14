import casual from 'casual';

export function generateMockData(): string {
	// Generate a random mock string by combining a random word and a random number
	return casual.word + '_' + casual.integer(1, 100);
}
