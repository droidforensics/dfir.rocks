import React, { useState } from 'react';
import styles from './QuestionAndAnswer.module.css';

export default function QuestionAnswer({ question, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.questionAnswer}>
      <div 
        className={styles.question}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <span className={styles.arrow}>{isOpen ? '▼' : '▶'}</span>
      </div>
      {isOpen && (
        <div className={styles.answer}>
          {children}
        </div>
      )}
    </div>
  );
}