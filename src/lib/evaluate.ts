import { TileState, EvaluationResult, WORD_LENGTH } from '@/types/game';

/**
 * Evaluate a guess against an answer word
 * Returns the state for each letter position and whether the guess is correct
 */
export function evaluateGuess(guess: string, answer: string): EvaluationResult {
  const guessUpper = guess.toUpperCase();
  const answerUpper = answer.toUpperCase();
  
  if (guessUpper.length !== WORD_LENGTH || answerUpper.length !== WORD_LENGTH) {
    throw new Error(`Words must be ${WORD_LENGTH} letters`);
  }
  
  const states: TileState[] = new Array(WORD_LENGTH).fill('absent');
  const answerLetterCounts: Record<string, number> = {};
  
  // Count letters in answer
  for (const letter of answerUpper) {
    answerLetterCounts[letter] = (answerLetterCounts[letter] || 0) + 1;
  }
  
  // First pass: mark correct letters (green)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessUpper[i] === answerUpper[i]) {
      states[i] = 'correct';
      answerLetterCounts[guessUpper[i]]--;
    }
  }
  
  // Second pass: mark present letters (yellow)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (states[i] !== 'correct') {
      const letter = guessUpper[i];
      if (answerLetterCounts[letter] && answerLetterCounts[letter] > 0) {
        states[i] = 'present';
        answerLetterCounts[letter]--;
      }
    }
  }
  
  const isCorrect = guessUpper === answerUpper;
  
  return { states, isCorrect };
}

/**
 * Update keyboard state based on new evaluation
 * Priority: correct > present > absent (a key can only get "better")
 */
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
    
    // Priority order: correct > present > absent > undefined
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

/**
 * Get aggregated keyboard state across all boards
 * For each letter, show the "best" state from any board
 */
export function aggregateKeyboardStates(
  guesses: string[],
  boards: { answer: string; solved: boolean; solvedAtGuess: number | null }[]
): Record<string, TileState> {
  let keyboardState: Record<string, TileState> = {};
  
  for (const guess of guesses) {
    const guessIndex = guesses.indexOf(guess);
    for (const board of boards) {
      // Only evaluate if board wasn't already solved before this guess
      if (!board.solved || board.solvedAtGuess === null || guessIndex <= board.solvedAtGuess) {
        const evaluation = evaluateGuess(guess, board.answer);
        keyboardState = updateKeyboardState(keyboardState, guess, evaluation.states);
      }
    }
  }
  
  return keyboardState;
}

