/** Blocking inline scripts — keep sync with ThemeProvider / Admin / MyEvent storage keys. */

/**
 * Root layout:
 * - /admin, /my-event, /sites → never leave marketplace dark on html
 * - organizer subdomain host → force light html
 * - marketplace → bilitmall-theme (system fallback)
 */
export const THEME_NO_FLASH_SCRIPT = `(function(){try{var p=location.pathname||"";var h=(location.hostname||"").toLowerCase();var admin=p.indexOf("/admin")===0;var my=p.indexOf("/my-event")===0;var sites=p==="/sites"||p.indexOf("/sites/")===0;var reserved={www:1,api:1,admin:1,cdn:1,static:1,mail:1,app:1,staging:1,"my-event":1,myevent:1};function isOrgHost(){if(/^myevent\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.(ae|localhost)$/.test(h))return true;var parts=h.split(".");if(parts.length<2)return false;var label=parts[0];if(reserved[label])return false;if(parts.length===2&&parts[1]==="localhost")return true;if(parts.length>=3&&parts.slice(-2).join(".")==="bilitmall.com")return true;if(parts.length>=3&&parts.slice(-2).join(".")==="myevent.ae")return true;return false;}if(admin||my||sites||isOrgHost()){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";return;}var t=localStorage.getItem("bilitmall-theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(_){}})();`;

/** Admin layout: clear html dark, then apply admin-theme on #admin-theme-root. */
export const ADMIN_THEME_NO_FLASH_SCRIPT = `(function(){try{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";var t=localStorage.getItem("admin-theme");var e=document.getElementById("admin-theme-root");if(e){e.classList.toggle("dark",t==="dark");}}catch(_){}})();`;

/** My Event studio: clear html dark, then apply myevent-theme on #my-event-theme-root. */
export const MY_EVENT_THEME_NO_FLASH_SCRIPT = `(function(){try{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";var t=localStorage.getItem("myevent-theme");var e=document.getElementById("my-event-theme-root");if(e){e.classList.toggle("dark",t==="dark");}}catch(_){}})();`;
