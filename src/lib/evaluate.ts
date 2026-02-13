import { TileState, EvaluationResult } from '@/types/game';

export function evaluateGuess(guess: string, answer: string, wordLength = answer.length): EvaluationResult {
  const guessUpper = guess.toUpperCase();
  const answerUpper = answer.toUpperCase();
  
  if (guessUpper.length !== wordLength || answerUpper.length !== wordLength) {
    throw new Error(`Words must be ${wordLength} letters`);
  }
  
  const states: TileState[] = new Array(wordLength).fill('absent');
  const answerLetterCounts: Record<string, number> = {};
  
  for (const letter of answerUpper) {
    answerLetterCounts[letter] = (answerLetterCounts[letter] || 0) + 1;
  }
  
  // First pass: mark correct letters (green)
  for (let i = 0; i < wordLength; i++) {
    if (guessUpper[i] === answerUpper[i]) {
      states[i] = 'correct';
      answerLetterCounts[guessUpper[i]]--;
    }
  }
  
  // Second pass: mark present letters (yellow)
  for (let i = 0; i < wordLength; i++) {
    if (states[i] !== 'correct') {
      const letter = guessUpper[i];
      if (answerLetterCounts[letter] && answerLetterCounts[letter] > 0) {
        states[i] = 'present';
        answerLetterCounts[letter]--;
      }
    }
  }
  
  return { states, isCorrect: guessUpper === answerUpper };
}

export function updateKeyboardState(
  currentState: Record<string, TileState>,
  guess: string,
  evaluation: TileState[]
): Record<string, TileState> {
  const newState = { ...currentState };
  const guessUpper = guess.toUpperCase();
  
  for (let i = 0; i < guessUpper.length; i++) {
    const letter = guessUpper[i];
    const newTileState = evaluation[i];
    const currentTileState = newState[letter];
    
    // Priority: correct > present > absent > undefined
    if (
      !currentTileState ||
      (currentTileState === 'absent' && (newTileState === 'present' || newTileState === 'correct')) ||
      (currentTileState === 'present' && newTileState === 'correct')
    ) {
      newState[letter] = newTileState;
    }
  }
  
  return newState;
}
