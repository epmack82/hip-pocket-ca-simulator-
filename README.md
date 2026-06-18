# Hip Pocket — Civil Affairs HADR Training Simulator v4.3

A React-based AI-powered training simulator for U.S. Army Civil Affairs personnel. Provides realistic HADR (Humanitarian Assistance/Disaster Relief) scenario-based training with doctrine-grounded assessment standards.

## Features

- **Character Creation**: Select your role (Specialist, CANCO, Team SGT, Team Chief) and mission duration (3/7/14/29 days)
- **Difficulty Scaling**: Role-based difficulty multipliers and day-based complexity escalation
- **Scenario Randomization**: Same 3 locations (School, Fire Station, Water Treatment) in randomized order each mission
- **Annex K Briefing**: Mission context and ASCOPE baseline before deployment
- **Save/Load System**: 5 save slots with localStorage persistence
- **AI-Powered Evaluation**: Claude API evaluates player actions against STP 41-38B34 performance standards
- **Product Management**: Create and route CA products per CNDE rules
- **Relationship Tracking**: Build/damage relationships with 6 key stakeholders
- **Debrief Generation**: After-action review with award recommendations

## Technology

- **Frontend**: React 18
- **UI Components**: Lucide React icons, Tailwind CSS
- **Backend**: Anthropic Claude API (claude-sonnet-4-6)
- **Storage**: Browser localStorage
- **Deployment**: Vercel

## Getting Started (Local Development)

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

## Deployment (Vercel)

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Vercel automatically deploys on every push
4. Share the live URL

## Environment Variables

If running locally, you may need to set:
```
REACT_APP_ANTHROPIC_API_KEY=your_key_here
```

## Project Structure

```
hippocket-ca-simulator/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx           (Main Hip Pocket component)
│   ├── index.js          (Entry point)
│   └── index.css         (Global styles)
├── package.json
└── README.md
```

## Doctrine References

- FM 3-57 (Civil Affairs Operations)
- ATP 3-57.50 (Civil Knowledge Integration)
- STP 41-38B34 (38B Performance Standards)
- ATP 3-57.30 (Civil Network Engagement)

## Author

Built for the 492nd Civil Affairs Battalion, Bravo Company (INDOPACOM)

## Version

**v4.3** — Character creation, difficulty scaling, and persistence layer complete
