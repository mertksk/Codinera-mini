"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize state without assuming a default theme to avoid initial mismatch
  const [theme, setTheme] = useState<Theme | null>(null);

  // Effect to determine the initial theme on mount (client-side only)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme("dark");
    } else {
      setTheme("light"); // Default to light if nothing else is set
    }
  }, []);

  // Effect to apply the theme class to the HTML element *after* state is set
  useEffect(() => {
    if (theme) {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]); // Run whenever the theme state changes

  const toggleTheme = () => {
    // Ensure theme is not null before toggling
    if (!theme) return; 
    
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    // The useEffect above will handle the class toggle
  };

  // Prevent rendering children until the theme is determined to avoid flash/mismatch
  if (!theme) {
    return null; // Or a loading indicator, but null avoids rendering potentially mismatched content
  }

  // Pass the non-null theme to the context
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
