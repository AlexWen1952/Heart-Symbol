import type { LocalizedString, Locale } from './locale';
import type { SymbolId } from './symbol';

export type Topic = 'love' | 'career' | 'money' | 'family' | 'self' | 'health';

export type Emotion = 'anxious' | 'confused' | 'sad' | 'hopeful' | 'stuck';

export type SessionStep =
  | 'topic'
  | 'concern'
  | 'emotion'
  | 'ritual'
  | 'draw'
  | 'reading';

export interface SessionState {
  /** Schema version — increment if the shape changes incompatibly. */
  version: 1;
  topic?: Topic;
  emotion?: Emotion;
  symbolId?: SymbolId;
  concern?: string;
  /** Whether the concern text triggered the crisis keyword scan. */
  crisisDetected?: boolean;
  /** ISO YYYY-MM-DD — set when the session begins and never changes. */
  dateString: string;
  locale: Locale;
  step: SessionStep;
}

export const TOPIC_LABELS: Record<Topic, LocalizedString> = {
  love:   { en: 'Love',   zh: '爱情' },
  career: { en: 'Career', zh: '事业' },
  money:  { en: 'Money',  zh: '财务' },
  family: { en: 'Family', zh: '家庭' },
  self:   { en: 'Self',   zh: '自我' },
  health: { en: 'Health', zh: '健康' },
};

export const EMOTION_LABELS: Record<Emotion, LocalizedString> = {
  anxious:  { en: 'Anxious',  zh: '焦虑' },
  confused: { en: 'Confused', zh: '困惑' },
  sad:      { en: 'Sad',      zh: '悲伤' },
  hopeful:  { en: 'Hopeful',  zh: '充满希望' },
  stuck:    { en: 'Stuck',    zh: '卡住了' },
};

/** TOPICS in fixed display order. */
export const TOPICS: Topic[] = ['love', 'career', 'money', 'family', 'self', 'health'];

/** EMOTIONS in fixed display order. */
export const EMOTIONS: Emotion[] = ['anxious', 'confused', 'sad', 'hopeful', 'stuck'];
