import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css"; // Default styles

const TopLoader = () => {
  useEffect(() => {
    NProgress.start(); // Start progress bar when component mounts
    return () => {
      NProgress.done(); // Stop progress bar when component unmounts
    };
  }, []);

  return null; // No visible content, just triggers the effect
};

export default TopLoader;
