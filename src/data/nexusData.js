const nexusData = {
  navigation: {
    main: [
      { id: 'overview', label: 'Overview', icon: '◈' },
      { id: 'today', label: 'Today', icon: '●' },
      { id: 'week', label: 'Week', icon: '◷' },
      { id: 'company', label: 'Company', icon: '◫' },
      { id: 'log', label: 'Log', icon: '◌' },
      { id: 'review', label: 'Review', icon: '◎' },
    ],
    departments: [],
    viewModes: [],
  },
  inputs: {
    wakeTime: '07:30',
    sideJobBlocks: [
      { id: 'fixed-side-job', label: 'Side Job', type: 'side-job', start: '18:00', end: '21:00' }
    ],
    gym: {
      preferredDays: ['Tue', 'Thu', 'Sat'],
      fixedToday: false,
      defaultDuration: 60
    }
  },
  primaryAction: {
    mode: 'Execution Mode',
    nextAction: 'Start with the Nexus state cleanup and verify Today controls end-to-end',
    weeklyPriority: 'Make Nexus fully usable as a real daily operating system',
    milestone: 'Stabilize Today execution flow and remove remaining partial interactions'
  },
  dashboard: {
    energyLoad: 'Fresh start with one clear UI stabilization task first',
    keyStatus: 'Closeout logged, unfinished work carried into a clean tomorrow state'
  },
  scheduleBlocks: [
    { id: 'fixed-wake', date: '2026-03-20', label: 'Wake / Setup', type: 'system', start: '07:30', end: '08:00', fixed: true },
    { id: 'fixed-side-job', date: '2026-03-20', label: 'Side Job', type: 'side-job', start: '18:00', end: '21:00', fixed: true }
  ],
  dailyTasks: [
    {
      id: 'daily-2026-03-20-1',
      date: '2026-03-20',
      title: 'Verify Start Block, Add Block, Extend, and Stop / Exit in the live Today flow',
      status: 'active',
      blockId: null,
      sourceWeeklyTaskId: 'weekly-2026-03-20-1',
      startedAt: null,
      completedAt: null,
      durationMinutes: 30
    },
    {
      id: 'daily-2026-03-20-2',
      date: '2026-03-20',
      title: 'Run full task lifecycle test: Start Now → Schedule → Complete → History',
      status: 'active',
      blockId: null,
      sourceWeeklyTaskId: 'weekly-2026-03-20-2',
      startedAt: null,
      completedAt: null,
      durationMinutes: 45
    },
    {
      id: 'daily-2026-03-20-3',
      date: '2026-03-20',
      title: 'Tighten Today page hierarchy so execution stays dominant over recommendations',
      status: 'active',
      blockId: null,
      sourceWeeklyTaskId: 'weekly-2026-03-20-3',
      startedAt: null,
      completedAt: null,
      durationMinutes: 30
    }
  ],
  weeklyTasks: [
    {
      id: 'weekly-2026-03-20-1',
      title: 'Verify Start Block, Add Block, Extend, and Stop / Exit in the live Today flow',
      plannedDay: '2026-03-20',
      status: 'moved-to-today',
      preferredBlockType: 'work'
    },
    {
      id: 'weekly-2026-03-20-2',
      title: 'Run full task lifecycle test: Start Now → Schedule → Complete → History',
      plannedDay: '2026-03-20',
      status: 'moved-to-today',
      preferredBlockType: 'work'
    },
    {
      id: 'weekly-2026-03-20-3',
      title: 'Tighten Today page hierarchy so execution stays dominant over recommendations',
      plannedDay: '2026-03-20',
      status: 'moved-to-today',
      preferredBlockType: 'work'
    },
    {
      id: 'weekly-2026-03-20-4',
      title: 'Review Dashboard and Weekly summaries after Today stabilization',
      plannedDay: '2026-03-20',
      status: 'planned',
      preferredBlockType: 'work'
    },
    {
      id: 'weekly-2026-03-20-5',
      title: 'Prepare next Hephaestus build step after Nexus closeout',
      plannedDay: '2026-03-21',
      status: 'planned',
      preferredBlockType: 'work'
    }
  ],
  completedHistory: {
    '2026-03-19': [
      {
        id: 'history-2026-03-19-1',
        taskId: 'closeout-1',
        title: 'Built sidebar-driven command center shell for Nexus',
        startedAt: '21:00',
        completedAt: '21:18',
        durationMinutes: 18,
        blockId: null
      },
      {
        id: 'history-2026-03-19-2',
        taskId: 'closeout-2',
        title: 'Upgraded Today into the main execution page with task completion flow',
        startedAt: '21:45',
        completedAt: '22:13',
        durationMinutes: 28,
        blockId: null
      },
      {
        id: 'history-2026-03-19-3',
        taskId: 'closeout-3',
        title: 'Separated schedule blocks, daily tasks, weekly staging, and history models',
        startedAt: '22:45',
        completedAt: '22:59',
        durationMinutes: 14,
        blockId: null
      },
      {
        id: 'history-2026-03-19-4',
        taskId: 'closeout-4',
        title: 'Added real-time recommendation-driven planning and linked task/timeline controls',
        startedAt: '23:15',
        completedAt: '23:57',
        durationMinutes: 42,
        blockId: null
      }
    ],
    '2026-03-18': [
      {
        id: 'history-1',
        taskId: 'daily-prev-1',
        title: 'Prepare build notes',
        startedAt: '09:10',
        completedAt: '09:52',
        durationMinutes: 42,
        blockId: null
      }
    ]
  },
  recommendationCategories: {
    life: ['Pause', 'Meal', 'Sport', 'Recovery'],
    departments: ['Nexus', 'Hephaestus', 'Xenon']
  },
  lifeOptions: {
    Pause: [
      {
        id: 'pause-breathing',
        title: 'Breathing break',
        description: 'Short reset before the next verification block.',
        defaultDuration: 5,
        minDuration: 5,
        maxDuration: 15,
        step: 5,
        size: 'small',
        actionType: 'schedule',
        blockType: 'break'
      },
      {
        id: 'pause-coffee',
        title: 'Coffee reset',
        description: 'Quick reset between interaction tests.',
        defaultDuration: 10,
        minDuration: 10,
        maxDuration: 20,
        step: 5,
        size: 'small',
        actionType: 'schedule',
        blockType: 'break',
        validTime: ['morning', 'afternoon']
      },
      {
        id: 'pause-walk',
        title: 'Walk break',
        description: 'Movement break before the next focused pass.',
        defaultDuration: 15,
        minDuration: 10,
        maxDuration: 20,
        step: 5,
        size: 'small',
        actionType: 'schedule',
        blockType: 'recovery'
      }
    ],
    Meal: [
      {
        id: 'meal-quick',
        title: 'Quick breakfast',
        description: 'Short breakfast block before the next work session.',
        defaultDuration: 20,
        minDuration: 15,
        maxDuration: 30,
        step: 5,
        size: 'small',
        actionType: 'schedule',
        blockType: 'meal',
        validTime: ['morning']
      },
      {
        id: 'meal-light',
        title: 'Light lunch',
        description: 'Normal lunch block in an open midday gap.',
        defaultDuration: 30,
        minDuration: 20,
        maxDuration: 40,
        step: 5,
        size: 'medium',
        actionType: 'schedule',
        blockType: 'meal',
        validTime: ['midday']
      },
      {
        id: 'meal-full',
        title: 'Full meal',
        description: 'Longer meal if the afternoon or evening remains open.',
        defaultDuration: 45,
        minDuration: 30,
        maxDuration: 60,
        step: 15,
        size: 'medium',
        actionType: 'schedule',
        blockType: 'meal',
        validTime: ['midday', 'evening']
      }
    ],
    Sport: [
      {
        id: 'sport-mobility',
        title: 'Mobility session',
        description: 'Short movement reset after UI testing.',
        defaultDuration: 20,
        minDuration: 15,
        maxDuration: 30,
        step: 5,
        size: 'small',
        actionType: 'schedule',
        blockType: 'gym',
        validTime: ['afternoon', 'evening']
      },
      {
        id: 'sport-run',
        title: 'Run',
        description: 'Moderate cardio if a larger afternoon window opens.',
        defaultDuration: 45,
        minDuration: 30,
        maxDuration: 60,
        step: 15,
        size: 'medium',
        actionType: 'schedule',
        blockType: 'gym',
        validTime: ['afternoon', 'evening']
      },
      {
        id: 'sport-gym',
        title: 'Gym session',
        description: 'Full gym block if work closes early enough.',
        defaultDuration: 60,
        minDuration: 45,
        maxDuration: 75,
        step: 15,
        size: 'medium',
        actionType: 'schedule',
        blockType: 'gym',
        validTime: ['afternoon', 'evening']
      }
    ],
    Recovery: [
      {
        id: 'recovery-rest',
        title: 'Eyes-closed rest',
        description: 'Quiet reset after a dense debugging pass.',
        defaultDuration: 15,
        minDuration: 10,
        maxDuration: 20,
        step: 5,
        size: 'small',
        actionType: 'schedule',
        blockType: 'recovery',
        validTime: ['afternoon', 'evening']
      },
      {
        id: 'recovery-noscreen',
        title: 'No-screen reset',
        description: 'Step away from the UI before the next block.',
        defaultDuration: 20,
        minDuration: 15,
        maxDuration: 30,
        step: 5,
        size: 'small',
        actionType: 'schedule',
        blockType: 'recovery',
        validTime: ['afternoon', 'evening']
      },
      {
        id: 'recovery-unwind',
        title: 'Unwind block',
        description: 'Longer recovery if the control pass runs long.',
        defaultDuration: 30,
        minDuration: 20,
        maxDuration: 45,
        step: 5,
        size: 'medium',
        actionType: 'schedule',
        blockType: 'recovery',
        validTime: ['afternoon', 'evening']
      }
    ]
  },
  departmentQueues: {
    Nexus: [
      { id: 'nexus-1', title: 'Verify live Today interactions', description: 'Check the remaining visible controls in the real flow.', duration: 30, size: 'medium' },
      { id: 'nexus-2', title: 'Tighten execution hierarchy', description: 'Keep Active Now and Today Tasks visually dominant.', duration: 30, size: 'medium' },
      { id: 'nexus-3', title: 'Review recommendation feedback text', description: 'Make recommendation outcomes clearer before accept.', duration: 20, size: 'small' }
    ],
    Hephaestus: [
      { id: 'hephaestus-1', title: 'Prepare next build step', description: 'Package the next meaningful Hephaestus action.', duration: 30, size: 'medium' },
      { id: 'hephaestus-2', title: 'Review active task status', description: 'Short pass over remaining Hephaestus tasks.', duration: 15, size: 'small' },
      { id: 'hephaestus-3', title: 'Deep work on active build', description: 'Focused Hephaestus work once Nexus is stable.', duration: 60, size: 'medium' }
    ],
    Xenon: [
      { id: 'xenon-1', title: 'Define first active task', description: 'Turn Xenon into a concrete next action after Nexus.', duration: 20, size: 'small' },
      { id: 'xenon-2', title: 'Review Xenon scope', description: 'Short planning pass for Xenon direction.', duration: 30, size: 'medium' },
      { id: 'xenon-3', title: 'Prepare next Xenon work block', description: 'Package the next block of Xenon work.', duration: 45, size: 'medium' }
    ]
  },
  pages: {
    today: {
      title: 'Today',
      subtitle: 'Continue from yesterday with a clean first block',
      focusBlocks: [
        'Start with the Nexus interaction verification pass',
        'Close the task lifecycle test end-to-end',
        'Then tighten hierarchy and summaries only if needed'
      ]
    },
    weekly: {
      title: 'Weekly',
      subtitle: 'Stage work by day',
      priority: 'Make Nexus fully usable as a real daily operating system',
      outcomes: [
        'Stabilize the Today execution surface',
        'Keep task flow and history accurate',
        'Leave Hephaestus ready for the next build step'
      ],
      weekPlan: {
        work: ['Fri: finish Nexus stabilization first', 'Then prepare the next Hephaestus build block'],
        gym: ['Keep one flexible gym slot if the afternoon opens'],
        rest: ['Keep at least one recovery block between dense work sessions']
      }
    },
    history: {
      title: 'History',
      subtitle: 'Proof of completed work'
    },
    system: {
      title: 'System',
      subtitle: 'State, health, and sync',
      health: 'Healthy',
      sync: 'Browser time + local state'
    },
    departments: {
      nexus: {
        title: 'Nexus Department',
        subtitle: 'Improve the system itself',
        focus: 'Finish interactive Today stability and confirm tomorrow-ready flow',
        phase: 'Usability stabilization',
        nextActions: [
          'Verify all visible Today controls in sequence',
          'Confirm task completion writes cleanly to History',
          'Polish only the hierarchy that still blocks use'
        ],
        done: [
          'Built command-center shell',
          'Added recommendation-driven scheduling',
          'Linked tasks and timeline blocks'
        ]
      },
      hephaestus: {
        title: 'Hephaestus',
        subtitle: 'Build execution work',
        focus: 'Prepare the next build step after Nexus stabilization',
        phase: 'Queued next',
        nextActions: [
          'Review current build tasks',
          'Package the next implementation step'
        ],
        done: [
          'Phase 1 foundation complete'
        ]
      },
      xenon: {
        title: 'Xenon',
        subtitle: 'Track Xenon workstream',
        focus: 'Remain parked until Nexus and Hephaestus are clear',
        phase: 'Idle',
        nextActions: [
          'Define first active task when capacity opens'
        ],
        done: [
          'Base structure created'
        ]
      },
      aureon: {
        title: 'AUREON',
        subtitle: 'Capital generation execution support',
        focus: 'Run outreach and follow-up loops to generate calls',
        phase: 'Phase 1',
        nextActions: [
          'Respond to replies first',
          'Execute pending FU1/FU2 follow-ups'
        ],
        done: [
          'Execution layer initialized'
        ]
      }
    }
  },
  tracking: {
    phaseProgress: {
      currentPhase: 'VORTEX — PHASE 1 — FOUNDATION',
      completion: '100%',
      nextMilestone: 'Start VORTEX Phase 2'
    },
    controlStatus: {
      systemState: 'NEXUS active',
      currentFocus: 'Tomorrow starts with Nexus interaction verification, then task lifecycle validation',
      progress: 'Today closed out and tomorrow state prepared'
    }
  }
};

export default nexusData;
