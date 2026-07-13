// 8 project templates — identical to the PC version (forge/templates-gallery.tsx)
import {
  CheckSquare, UtensilsCrossed, Code2, CloudSun, Wallet, Timer, FileText, Brain,
  type LucideIcon,
} from 'lucide-react'

export interface ProjectTemplate {
  id: string
  name: string
  tagline: string
  description: string
  icon: LucideIcon
  accent: string // tailwind gradient classes
  features: string[]
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'taskflow',
    name: 'TaskFlow',
    tagline: 'Gestion de taches moderne',
    description: 'Application de gestion de taches avec categories colorees, priorites, statistiques hebdomadaires et filtrage avance. Stockage local persistant.',
    icon: CheckSquare,
    accent: 'from-cyan-500/20 to-blue-500/20',
    features: ['forms', 'charts', 'tables'],
  },
  {
    id: 'recipebox',
    name: 'RecipeBox',
    tagline: 'Carnet de recettes culinaire',
    description: 'Carnet de recettes personnel avec recherche par ingredient, favoris, calcul de portions et mode cuisine plein ecran. Import depuis URL.',
    icon: UtensilsCrossed,
    accent: 'from-amber-500/20 to-orange-500/20',
    features: ['api', 'forms'],
  },
  {
    id: 'devportfolio',
    name: 'DevPortfolio',
    tagline: 'Portfolio developpeur',
    description: 'Portfolio developpeur elegant avec sections projets, competences, experience et contact. Animations au scroll, theme sombre, responsive.',
    icon: Code2,
    accent: 'from-violet-500/20 to-purple-500/20',
    features: ['animations', 'darkmode'],
  },
  {
    id: 'weathercast',
    name: 'WeatherCast',
    tagline: 'Meteo & previsions',
    description: 'Dashboard meteo avec previsions 7 jours, carte interactive, alertes et historique de recherche. Donnees mock realistes integrees.',
    icon: CloudSun,
    accent: 'from-sky-500/20 to-teal-500/20',
    features: ['charts', 'api'],
  },
  {
    id: 'expensetracker',
    name: 'ExpenseTracker',
    tagline: 'Suivi de depenses',
    description: 'Tracker de depenses avec categories, graphiques mensuels, budget cible et export CSV. Saisie rapide + statistiques visuelles.',
    icon: Wallet,
    accent: 'from-emerald-500/20 to-green-500/20',
    features: ['charts', 'forms', 'tables'],
  },
  {
    id: 'pomodoro',
    name: 'PomodoroPro',
    tagline: 'Timer Pomodoro avance',
    description: 'Timer Pomodoro avec cycles travail/pause parametrables, statistiques de productivite, sons de notification et historique des sessions.',
    icon: Timer,
    accent: 'from-rose-500/20 to-pink-500/20',
    features: ['animations', 'charts'],
  },
  {
    id: 'markdownnotes',
    name: 'MarkdownNotes',
    tagline: 'Editeur de notes Markdown',
    description: 'Editeur de notes Markdown avec preview live, dossiers, recherche full-text, export et raccourcis clavier. Persistance locale automatique.',
    icon: FileText,
    accent: 'from-slate-500/20 to-zinc-500/20',
    features: ['forms'],
  },
  {
    id: 'quizmaster',
    name: 'QuizMaster',
    tagline: 'Createur de quiz interactifs',
    description: 'Createur de quiz avec editeur de questions, mode chronometre, score en temps reel, classement et partage de liens. Banque de questions integree.',
    icon: Brain,
    accent: 'from-indigo-500/20 to-blue-500/20',
    features: ['forms', 'animations', 'charts'],
  },
]

export const SAMPLE_IDEAS = [
  'Une app de gestion de taches avec categories et statistiques',
  'Un portfolio developpeur avec projets et contact',
  'Un convertisseur de devises avec historique',
  'Un lecteur de podcasts avec favoris',
]
