import { useState, useEffect, useRef } from 'react';

function TypewriterText({ text, speed = 30, className }) {
  const [displayed, setDisplayed] = useState('');
  const prevTextRef = useRef('');

  useEffect(() => {
    if (text === prevTextRef.current) return;
    prevTextRef.current = text;

    if (!text) {
      setDisplayed('');
      return;
    }

    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className={className}>{displayed}<span className="typewriter-cursor">|</span></span>;
}

export default TypewriterText;
