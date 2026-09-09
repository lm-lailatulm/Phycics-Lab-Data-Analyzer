# Physics Lab Data Analyzer

### Web-Based Physics Laboratory Data Analysis Application

Physics Lab Data Analyzer is a web-based application designed to simplify and automate data analysis for undergraduate physics laboratory experiments.

The application allows students to enter experimental measurements and obtain calculated results, data visualization, linear regression analysis, and experimental error analysis through an interactive interface.

---

## Overview

Physics laboratory sessions often require students to perform repetitive calculations and manually create graphs before interpreting their experimental results.

Physics Lab Data Analyzer was developed as a solution to simplify this process.

The application provides an integrated environment where experimental data can be entered and analyzed automatically, helping students perform calculations more efficiently and consistently.

This project was developed based on practical needs encountered during undergraduate physics laboratory activities.

---

## Supported Experiments

The application currently supports several fundamental physics laboratory experiments:

### 1. Gravitational Acceleration

Analyzes experimental data related to the determination of gravitational acceleration.

The analysis includes:

- Experimental data processing
- Linear regression
- Graph generation
- Calculation of experimental results
- Experimental error analysis

### 2. Spring Constant

Analyzes data related to the determination of the spring constant based on spring behavior.

The application provides:

- Data processing
- Linear regression
- Graph visualization
- Spring constant calculation
- Experimental error analysis

### 3. Speed of Sound

Processes experimental measurements for determining the speed of sound.

The analysis includes:

- Experimental data processing
- Calculation of physical quantities
- Graph visualization
- Result analysis
- Experimental error calculation

### 4. Surface Tension

Analyzes experimental data for determining surface tension.

The application provides:

- Experimental data processing
- Automatic calculations
- Graph visualization
- Experimental result analysis
- Error analysis

---

## Key Features

- Automated physics laboratory data analysis
- Linear regression analysis
- Interactive data visualization
- Automatic calculation of experimental results
- Experimental error and accuracy calculations
- Multiple physics experiment modules
- Interactive data input
- User-friendly interface
- Structured experiment-specific analysis
- Google Gemini API integration

---

## Why This Project?

The project aims to reduce repetitive manual calculations during physics laboratory data analysis.

Instead of manually performing calculations and creating graphs separately, students can enter their experimental measurements into the application and obtain the required analysis in an integrated workflow.

This approach helps make laboratory data analysis:

- Faster
- More organized
- More consistent
- Easier to interpret

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Libraries & Tools

- Google Gemini API
- Lucide React
- Motion
- Express
- Node.js

---

## Application Architecture

The application uses a component-based architecture in React.

Each experiment is organized into its own component, allowing the analysis logic and user interface for different experiments to be managed separately.

```text
physics-lab-data-analyzer/
│
├── src/
│   ├── components/
│   │   ├── FormulaGuide.tsx
│   │   ├── GravitasiExperiment.tsx
│   │   ├── PegasExperiment.tsx
│   │   ├── GelombangBunyiExperiment.tsx
│   │   ├── TeganganPermukaanExperiment.tsx
│   │   ├── InteractivePhysicsChart.tsx
│   │   ├── NumericCell.tsx
│   │   └── WelcomePortal.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   └── utils.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js
- npm

### Installation

Clone this repository and navigate to the project directory.

```bash
git clone <repository-url>
cd physics-lab-data-analyzer
```

Install the required dependencies:

```bash
npm install
```

---

## Environment Variables

The application uses the Google Gemini API.

Create a `.env.local` file and configure your API key:

```env
GEMINI_API_KEY=your_api_key_here
```

> Never publish your actual API key to GitHub.

---

## Run the Application

Start the development server:

```bash
npm run dev
```

The application can then be accessed through the local development server.

---

## Build for Production

Create a production build using:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

## Educational Application

This project is designed for educational use in undergraduate physics laboratory activities.

It demonstrates how web technologies can be applied to support experimental physics data analysis and reduce repetitive computational tasks.

---

## Project Impact

Physics Lab Data Analyzer transforms a conventional laboratory analysis workflow:

```text
Experimental Measurements
          ↓
Manual Calculations
          ↓
Manual Graph Creation
          ↓
Error Calculation
          ↓
Result Interpretation
```

into a more integrated workflow:

```text
Experimental Measurements
          ↓
Physics Lab Data Analyzer
          ↓
Automatic Analysis
          ↓
Graphs + Calculated Results + Error Analysis
```

The goal is not to replace the physical experiment or scientific interpretation, but to assist students in processing their experimental data more efficiently.

---

## Future Development

Potential future improvements include:

- Additional physics laboratory experiments
- Export analysis results to PDF
- Export experimental data to CSV
- More advanced statistical analysis
- Experimental uncertainty propagation
- Improved data visualization
- Online deployment
- User authentication
- Laboratory report generation

---

## Author

**Lailatul Mufidah**

Physics Student  
Universitas Airlangga

---

## License

This project was developed for educational and portfolio purposes.
