import React, { useState } from 'react';
import { CheckCircle2, Layers, Inbox, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: <Layers size={32} color="#7c3aed" />,
    title: 'Your workspace is ready',
    body: 'NEXUS is your operational command center — tasks, projects, weekly reviews, and AI-powered planning in one place.',
  },
  {
    icon: <Inbox size={32} color="#7c3aed" />,
    title: 'Capture everything',
    body: 'Drop ideas and tasks into your Inbox instantly. Schedule or assign them when ready — nothing falls through the cracks.',
  },
  {
    icon: <Calendar size={32} color="#7c3aed" />,
    title: 'Plan your day',
    body: 'The Today view gives you a daily timeline. Drag tasks into time slots and let AI suggest the optimal schedule.',
  },
  {
    icon: <CheckCircle2 size={32} color="#22c55e" />,
    title: "You're all set",
    body: "We've created a sample project to get you started. Explore the app, or start adding your real work.",
  },
];

export default function OnboardingModal({ onComplete }: Props) {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    // Last step — create sample project + mark onboarding done
    setCompleting(true);
    if (user) {
      const projectId = `proj-sample-${user.id.slice(0, 8)}`;
      const now = new Date().toISOString();

      await supabase.from('projects').upsert({
        id:            projectId,
        user_id:       user.id,
        name:          'My First Project',
        department_id: null,
        status:        'active',
        phase:         'Getting started',
        priority:      'normal',
        current_state: 'Just created — explore NEXUS and add your tasks.',
        next_action:   'Add your first task',
        color:         '#7c3aed',
        last_updated:  now,
      }, { onConflict: 'id' });

      // Add a sample task
      const taskId = `task-sample-${user.id.slice(0, 8)}`;
      await supabase.from('tasks').upsert({
        id:            taskId,
        user_id:       user.id,
        project_id:    projectId,
        date:          new Date().toISOString().split('T')[0],
        title:         'Explore NEXUS — add your first real task',
        notes:         'Delete this when ready.',
        status:        'open',
        priority:      'normal',
        estimate:      15,
        time_slot:     null,
        subtask_count: 0,
        created_at:    now,
        updated_at:    now,
        completed_at:  null,
      }, { onConflict: 'id' });

      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
      await refreshProfile();
    }

    setCompleting(false);
    onComplete();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* Progress dots */}
        <div style={styles.dots}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                background: i === step ? '#7c3aed' : i < step ? '#4c1d95' : '#222',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={styles.iconWrap}>{current.icon}</div>
        <h2 style={styles.title}>{current.title}</h2>
        <p style={styles.body}>{current.body}</p>

        {/* Actions */}
        <div style={styles.actions}>
          {step > 0 && (
            <button style={styles.backBtn} onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          <button
            style={{ ...styles.nextBtn, flex: step === 0 ? 1 : undefined }}
            onClick={handleNext}
            disabled={completing}
          >
            {completing ? 'Setting up…' : isLast ? 'Get started' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  modal: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '16px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    marginBottom: '32px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  iconWrap: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 10px',
  },
  body: {
    fontSize: '14px',
    color: '#888',
    lineHeight: 1.7,
    margin: '0 0 32px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  backBtn: {
    padding: '11px 20px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
  },
  nextBtn: {
    flex: 1,
    padding: '11px 20px',
    background: '#7c3aed',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
