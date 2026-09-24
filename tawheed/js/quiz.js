// Flashcard Deck & Hifz Quiz Companion
import { Storage } from './storage.js';

export class QuizManager {
  constructor(namesData, onProgressUpdate = () => {}) {
    this.names = namesData;
    this.onProgressUpdate = onProgressUpdate;

    // Flashcard state
    this.flashcardIndex = 0;
    this.isCardFlipped = false;
    this.flashcardList = [...this.names];
    this.cardFrontArabic = true;

    // Quiz state
    this.currentQuestion = null;
    this.streak = 0;
    this.score = 0;
    this.totalAnswered = 0;
    this.isAnswered = false;
  }

  flipCard() {
    this.isCardFlipped = !this.isCardFlipped;
    return this.isCardFlipped;
  }

  nextCard() {
    this.isCardFlipped = false;
    this.flashcardIndex = (this.flashcardIndex + 1) % this.flashcardList.length;
    return this.getCurrentFlashcard();
  }

  prevCard() {
    this.isCardFlipped = false;
    this.flashcardIndex = (this.flashcardIndex - 1 + this.flashcardList.length) % this.flashcardList.length;
    return this.getCurrentFlashcard();
  }

  shuffleCards() {
    this.isCardFlipped = false;
    for (let i = this.flashcardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.flashcardList[i], this.flashcardList[j]] = [this.flashcardList[j], this.flashcardList[i]];
    }
    this.flashcardIndex = 0;
    return this.getCurrentFlashcard();
  }

  toggleCardSide() {
    this.cardFrontArabic = !this.cardFrontArabic;
    return this.cardFrontArabic;
  }

  getCurrentFlashcard() {
    return this.flashcardList[this.flashcardIndex];
  }

  toggleLearnedCurrent() {
    const item = this.getCurrentFlashcard();
    const isNowLearned = Storage.toggleLearned(item.id);
    if (this.onProgressUpdate) this.onProgressUpdate();
    return isNowLearned;
  }

  // Quiz Mode
  generateQuestion() {
    this.isAnswered = false;
    const correctIdx = Math.floor(Math.random() * this.names.length);
    const correctName = this.names[correctIdx];

    // Pick 3 distinct wrong answers
    const wrongOptions = [];
    while (wrongOptions.length < 3) {
      const randIdx = Math.floor(Math.random() * this.names.length);
      if (randIdx !== correctIdx && !wrongOptions.includes(this.names[randIdx])) {
        wrongOptions.push(this.names[randIdx]);
      }
    }

    const options = [correctName, ...wrongOptions];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    const isArabicToMeaning = Math.random() > 0.35;

    this.currentQuestion = {
      correctName,
      options,
      isArabicToMeaning,
      questionText: isArabicToMeaning
        ? `What is the English meaning of ${correctName.transliteration} (${correctName.arabic})?`
        : `Which Divine Name signifies: \"${correctName.meaning}\"?`
    };

    return this.currentQuestion;
  }

  submitAnswer(selectedId) {
    if (this.isAnswered) return null;
    this.isAnswered = true;
    this.totalAnswered++;

    const isCorrect = selectedId === this.currentQuestion.correctName.id;
    if (isCorrect) {
      this.streak++;
      this.score += 10 + (this.streak * 2);
    } else {
      this.streak = 0;
    }

    const stats = Storage.getQuizStats();
    stats.totalQuestions = (stats.totalQuestions || 0) + 1;
    if (isCorrect) stats.correctAnswers = (stats.correctAnswers || 0) + 1;
    if (this.streak > (stats.bestStreak || 0)) stats.bestStreak = this.streak;
    Storage.saveQuizStats(stats);

    return {
      isCorrect,
      correctId: this.currentQuestion.correctName.id,
      streak: this.streak,
      score: this.score,
      correctName: this.currentQuestion.correctName
    };
  }

  handleTimeout() {
    if (this.isAnswered) return null;
    this.isAnswered = true;
    this.totalAnswered++;
    this.streak = 0;

    const stats = Storage.getQuizStats();
    stats.totalQuestions = (stats.totalQuestions || 0) + 1;
    Storage.saveQuizStats(stats);

    return {
      isTimeout: true,
      isCorrect: false,
      correctId: this.currentQuestion.correctName.id,
      streak: this.streak,
      score: this.score,
      correctName: this.currentQuestion.correctName
    };
  }
}

