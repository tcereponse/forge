# EXTENSION : ext_diamond_core_nextjs
MISSION: Garantir un design et des dépendances Grade Diamond pour Next.js.

[[FILE: package.json]]
{
  "dependencies": {
    "lucide-react": "^0.330.0",
    "uuid": "^9.0.1",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}

[[FILE: postcss.config.js]]
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

[[FILE: app/globals.css]]
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  :root {
    --background: 0 0% 7%;
    --foreground: 0 0% 98%;
    --primary: 210 100% 50%;
    --border: 0 0% 20%;
    --radius: 0.75rem;
  }
}
