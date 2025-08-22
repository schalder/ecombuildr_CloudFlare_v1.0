const DEBUG_MODE = false; // Set to true for development debugging

export const logger = {
  debug: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.info(...args);
    }
  },
  
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  
  error: (...args: any[]) => {
    console.error(...args);
  }
};