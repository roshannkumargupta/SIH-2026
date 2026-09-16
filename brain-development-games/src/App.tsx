import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import AllGames from './pages/AllGames'
import ProgressAnalytics from './pages/ProgressAnalytics'
import Achievements from './pages/Achievements'
import DailyChallenge from './pages/DailyChallenge'
import Settings from './pages/Settings'
import WaterJugsPage from './pages/games/WaterJugsPage'
import TowerOfHanoiPage from './pages/games/TowerOfHanoiPage'
import BallSortPage from './pages/games/BallSortPage'
import NBackPage from './pages/games/NBackPage'
import StroopPage from './pages/games/StroopPage'
import MentalRotationPage from './pages/games/MentalRotationPage'
import SchulteTablePage from './pages/games/SchulteTablePage'
import MazePage from './pages/games/MazePage'
import PatternMatrixPage from './pages/games/PatternMatrixPage'
import QuickMathPage from './pages/games/QuickMathPage'
import WordScramblePage from './pages/games/WordScramblePage'
import SimonSaysPage from './pages/games/SimonSaysPage'
import CardMatchingPage from './pages/games/CardMatchingPage'
import ReactionTimePage from './pages/games/ReactionTimePage'
import NumberSequencePage from './pages/games/NumberSequencePage'
import DualTaskPage from './pages/games/DualTaskPage'
import VisualSearchPage from './pages/games/VisualSearchPage'
import AnagramSolverPage from './pages/games/AnagramSolverPage'
import TrailMakingPage from './pages/games/TrailMakingPage'
import WorkingMemoryGridPage from './pages/games/WorkingMemoryGridPage'
import LogicPuzzlesPage from './pages/games/LogicPuzzlesPage'
import DelayedRecallPage from './pages/games/DelayedRecallPage'

export default function App(): JSX.Element {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<AllGames />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/progress" element={<ProgressAnalytics />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/daily-challenge" element={<DailyChallenge />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/games/water-jugs" element={<WaterJugsPage />} />
        <Route path="/games/tower-of-hanoi" element={<TowerOfHanoiPage />} />
        <Route path="/games/ball-sort" element={<BallSortPage />} />
        <Route path="/games/n-back" element={<NBackPage />} />
        <Route path="/games/stroop" element={<StroopPage />} />
        <Route path="/games/mental-rotation" element={<MentalRotationPage />} />
        <Route path="/games/schulte-table" element={<SchulteTablePage />} />
        <Route path="/games/maze" element={<MazePage />} />
        <Route path="/games/pattern-matrix" element={<PatternMatrixPage />} />
        <Route path="/games/quick-math" element={<QuickMathPage />} />
        <Route path="/games/word-scramble" element={<WordScramblePage />} />
        <Route path="/games/simon-says" element={<SimonSaysPage />} />
        <Route path="/games/card-matching" element={<CardMatchingPage />} />
        <Route path="/games/reaction-time" element={<ReactionTimePage />} />
        <Route path="/games/number-sequence" element={<NumberSequencePage />} />
        <Route path="/games/dual-task" element={<DualTaskPage />} />
        <Route path="/games/visual-search" element={<VisualSearchPage />} />
        <Route path="/games/anagram-solver" element={<AnagramSolverPage />} />
        <Route path="/games/trail-making" element={<TrailMakingPage />} />
        <Route path="/games/working-memory-grid" element={<WorkingMemoryGridPage />} />
        <Route path="/games/logic-puzzles" element={<LogicPuzzlesPage />} />
        <Route path="/games/delayed-recall" element={<DelayedRecallPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
