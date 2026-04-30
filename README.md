# ZenFocus - Minimalist Focus & Interval Timer

ZenFocus is a polished, high-performance web application designed for deep work, study sessions, and productivity. It combines an elegant minimalist aesthetic with powerful features like custom interval sequencing, intermission buffers, and focus statistics.

## ✨ Features

- **Dynamic Interval Logic**: Set long focus sessions with recurring intervals and optional intermission "buffers" (rest periods).
- **Smooth Visual Feedback**: A high-speed SVG progress ring that animates in real-time, backed by a persistent timestamp-based timer engine.
- **Advanced Persistence**: Your settings, custom presets, and focus history are automatically saved to your browser's local storage.
- **Focus Statistics**: Visualize your productivity with built-in focus insights, session history, and weekly charts powered by `recharts`.
- **Keyboard Power User Shortcuts**:
  - `Space`: Start/Pause timer
  - `Key S`: Start
  - `Key P`: Pause
  - `Key F`: Toggle Fullscreen
  - `Esc`: Stop timer (with accidental-stop confirmation)
- **Deep Focus Mode**: A dedicated fullscreen experience that hides all distractions.
- **Zen Audio**: Custom interval and completion tones designed to be calming yet effective.
- **Responsive Design**: Carefully crafted for both desktop precision and mobile utility.
- **Wake Lock Support**: Automatically keeps your screen on during focus sessions (on supported browsers).

## 🛠️ Tech Stack

- **Framework**: React 18+ with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (via `motion/react`)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Audio**: Web Audio API

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/zenfocus.git
   cd zenfocus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Aesthetic

ZenFocus follows a "Modern Swiss" design philosophy:
- **Light Mode**: Warm cream (`#FDFCF8`) and sage (`#8B9A82`) tones for a paper-like feel.
- **Dark Mode**: Deep charcoal (`#222c31`) and slate for low-light focus.
- **Typography**: Clean sans-serif pairings with large, breathable spacing.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
