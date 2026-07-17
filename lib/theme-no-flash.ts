/** Blocking inline script for root layout — keep sync with ThemeProvider / MyEventThemeProvider storage keys. */
export const THEME_NO_FLASH_SCRIPT = `(function(){try{var p=location.pathname||"";var my=p.indexOf("/my-event")===0;var k=my?"myevent-theme":"bilitmall-theme";var t=localStorage.getItem(k);var d=my?t==="dark":(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches));document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(_){}})();`;

export const ADMIN_THEME_NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem("admin-theme");var e=document.getElementById("admin-theme-root");if(e&&t==="dark"){e.classList.add("dark");}}catch(_){}})();`;
